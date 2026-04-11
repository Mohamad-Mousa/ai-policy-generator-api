/**
 * Claude Service
 *
 * This service uses Anthropic's Claude AI to analyze policies and assess
 * a country's readiness to use AI in various domains based on expert assessments.
 *
 * Configuration Required (in .env file):
 * - CLAUDE_API_KEY: Your Anthropic API key (required)
 * - CLAUDE_API_URL: API endpoint (default: https://api.anthropic.com/v1/messages)
 * - CLAUDE_MODEL: Model to use (default: claude-sonnet-4-20250514)
 * - CLAUDE_MAX_TOKENS: Max tokens for response (default: 16000)
 * - CLAUDE_TEMPERATURE: Temperature for responses (default: 0.3)
 * - CLAUDE_THINKING_BUDGET: Tokens for extended thinking (default: 10000)
 *
 * Usage Example:
 * ```javascript
 * const ClaudeService = require('./services/core/claude.service');
 * const claudeService = new ClaudeService();
 *
 * // Full analysis with extended thinking
 * const analysis = await claudeService.analyzePolicyReadiness(policyId, {
 *   useExtendedThinking: true
 * });
 *
 * // Quick check
 * const quickCheck = await claudeService.quickReadinessCheck(policyId);
 *
 * // Domain-specific analysis
 * const domainAnalysis = await claudeService.analyzeDomain(policyId, domainId);
 * ```
 */

const axios = require("axios");
const config = require("../../config");
const BaseService = require("./base.service");
const CustomError = require("./custom_error.service");

class ClaudeService extends BaseService {
  constructor() {
    super();
    this.Policy = this.models.Policy;
    this.Assessment = this.models.Assessment;
    this.Domain = this.models.Domain;
    this.Question = this.models.Question;
    this.apiKey = config.claude.apiKey;
    this.apiUrl = config.claude.apiUrl;
    this.model = config.claude.model || "claude-sonnet-4-20250514";
    this.maxTokens = config.claude.maxTokens || 16000;
    this.temperature = config.claude.temperature || 0.3;
    this.thinkingBudget = config.claude.thinkingBudget || 10000;

    this.CONTEXT_WINDOW = 200000;
    this.SAFE_PROMPT_LIMIT = 150000;
  }

  /**
   * Validates Claude configuration
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new CustomError(
        "Claude API key is not configured. Please set CLAUDE_API_KEY in environment variables.",
        500,
      );
    }

    const validModels = [
      "claude-sonnet-4-20250514",
      "claude-sonnet-4-5-20250929",
      "claude-3-5-sonnet-20241022",
    ];

    if (!validModels.includes(this.model)) {
      console.warn(
        `Warning: Using non-standard model "${this.model}". Recommended: claude-sonnet-4-20250514`,
      );
    }
  }

  /**
   * Fetches policy data with all assessments, questions, and answers grouped by domain
   * @param {string} policyId - The policy ID to analyze
   * @returns {Promise<Object>} Structured policy data
   */
  async fetchPolicyData(policyId) {
    const policy = await this.Policy.findOne({
      _id: this.ObjectId(policyId),
      isDeleted: false,
      country: { $exists: true, $ne: null },
    })
      .populate({
        path: "country",
        select: "_id label value",
      })
      .populate({
        path: "domains",
        match: { isDeleted: false, isActive: true },
        select: "_id title description subDomains predefinedAssessmentTitle",
      })
      .populate({
        path: "assessments",
        match: { isDeleted: false, isActive: true },
        select:
          "_id title description fullName status domain questions scoreAvg scorePercentage",
      })
      .populate({
        path: "initiatives",
        select:
          "englishName originalName slug description overview actionPlan category status responsibleOrganisation startYear endYear targetSectors principles evaluationDescription monitoringMechanismDescription",
      })
      .lean();

    if (!policy) {
      throw new CustomError("Policy not found", 404);
    }

    if (!policy.country) {
      throw new CustomError("Policy must have a valid country", 400);
    }

    policy.domains = policy.domains.filter((d) => d !== null);
    policy.assessments = policy.assessments.filter((a) => a !== null);
    const linkedInitiatives = (policy.initiatives || []).filter((i) => i !== null);

    if (policy.domains.length === 0) {
      throw new CustomError("Policy has no valid domains", 400);
    }

    if (policy.assessments.length === 0) {
      throw new CustomError("Policy has no valid assessments", 400);
    }

    const questionIds = new Set();
    policy.assessments.forEach((assessment) => {
      if (assessment.questions && Array.isArray(assessment.questions)) {
        assessment.questions.forEach((qa) => {
          if (qa.questionRef) {
            questionIds.add(qa.questionRef.toString());
          }
        });
      }
    });

    const questions = await this.Question.find({
      _id: { $in: Array.from(questionIds).map((id) => this.ObjectId(id)) },
      isDeleted: false,
      isActive: true,
    })
      .select("_id question")
      .lean();

    const questionMap = new Map();
    questions.forEach((q) => {
      questionMap.set(q._id.toString(), q);
    });

    const domainMap = new Map();
    policy.domains.forEach((domain) => {
      domainMap.set(domain._id.toString(), {
        _id: domain._id,
        title: domain.title,
        description: domain.description,
        subDomains: domain.subDomains || [],
        predefinedAssessmentTitle: domain.predefinedAssessmentTitle,
        assessments: [],
      });
    });

    policy.assessments.forEach((assessment) => {
      const domainId = assessment.domain?.toString();
      if (domainId && domainMap.has(domainId)) {
        const enrichedAssessment = {
          _id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          fullName: assessment.fullName,
          status: assessment.status,
          scoreAvg: assessment.scoreAvg ?? null,
          scorePercentage: assessment.scorePercentage ?? null,
          questions: [],
        };

        if (assessment.questions && Array.isArray(assessment.questions)) {
          assessment.questions.forEach((qa) => {
            const questionId = qa.questionRef?.toString();
            const question = questionMap.get(questionId);
            if (question) {
              enrichedAssessment.questions.push({
                question: question.question,
                answer: qa.answer || "No answer provided",
              });
            }
          });
        }

        domainMap.get(domainId).assessments.push(enrichedAssessment);
      }
    });

    return {
      policy: {
        _id: policy._id,
        country: policy.country,
        sector: policy.sector,
        organizationSize: policy.organizationSize,
        riskAppetite: policy.riskAppetite,
        implementationTimeline: policy.implementationTimeline,
      },
      domains: Array.from(domainMap.values()),
      initiatives: linkedInitiatives,
      totalAssessments: policy.assessments.length,
      totalQuestions: questions.length,
      totalInitiatives: linkedInitiatives.length,
    };
  }

  /**
   * Builds a comprehensive prompt for Claude to analyze policy readiness
   * @param {Object} policyData - Structured policy data
   * @param {Object} options - Analysis options
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(policyData, options = {}) {
    const { policy, domains, initiatives = [] } = policyData;
    const { focusDomain = null } = options;

    const countryLabel =
      policy.country && (policy.country.label || policy.country.value)
        ? policy.country.label || policy.country.value
        : "N/A";

    let prompt = `You are an expert AI policy analyst specializing in national AI readiness assessments. Your task is to analyze expert survey data and provide evidence-based, actionable recommendations.

# POLICY CONTEXT
- **Country**: ${countryLabel}
- **Sector**: ${policy.sector}
- **Organization Size**: ${policy.organizationSize}
- **Risk Appetite**: ${policy.riskAppetite}
- **Implementation Timeline**: ${policy.implementationTimeline}

`;

    if (initiatives.length > 0) {
      prompt += `# LINKED AI GOVERNANCE INITIATIVES (REFERENCE)\n\n`;
      prompt += `The following official or catalog initiatives are attached to this policy. Use them as additional context alongside expert assessments—e.g. alignment, gaps, and how survey signals compare to stated initiative goals.\n\n`;
      initiatives.forEach((init, idx) => {
        prompt += `## Initiative ${idx + 1}: ${init.englishName || init.originalName || "Unnamed"}\n`;
        if (init.description) prompt += `**Description**: ${init.description}\n`;
        if (init.overview) prompt += `**Overview**: ${init.overview}\n`;
        if (init.actionPlan) prompt += `**Action Plan**: ${init.actionPlan}\n`;
        if (init.category) prompt += `**Category**: ${init.category}\n`;
        if (init.status) prompt += `**Status**: ${init.status}\n`;
        if (init.responsibleOrganisation) {
          prompt += `**Responsible Organisation**: ${init.responsibleOrganisation}\n`;
        }
        if (init.startYear != null || init.endYear != null) {
          prompt += `**Timeframe**: ${init.startYear ?? "?"} - ${init.endYear ?? "ongoing"}\n`;
        }
        if (
          init.targetSectors &&
          (Array.isArray(init.targetSectors) ? init.targetSectors.length : 0)
        ) {
          const sectors = Array.isArray(init.targetSectors)
            ? init.targetSectors
                .map((s) => (typeof s === "object" ? (s?.value ?? s?.name) : s))
                .filter(Boolean)
            : [init.targetSectors];
          prompt += `**Target Sectors**: ${sectors.join(", ")}\n`;
        }
        if (
          init.principles &&
          (Array.isArray(init.principles) ? init.principles.length : 0)
        ) {
          const principles = Array.isArray(init.principles)
            ? init.principles
                .map((p) => (typeof p === "object" ? (p?.value ?? p?.name) : p))
                .filter(Boolean)
            : [init.principles];
          prompt += `**Principles**: ${principles.join(", ")}\n`;
        }
        if (init.evaluationDescription) {
          prompt += `**Evaluation**: ${init.evaluationDescription}\n`;
        }
        if (init.monitoringMechanismDescription) {
          prompt += `**Monitoring**: ${init.monitoringMechanismDescription}\n`;
        }
        prompt += "\n";
      });
    }

    prompt += `# EXPERT ASSESSMENT DATA

Where present, each assessment lists **Radio score average (1–5)** and **Readiness percentage** (0–100, from radio answers only). Use these together with the Q&A below for a fuller picture.

`;

    const domainsToAnalyze = focusDomain
      ? domains.filter((d) => d._id.toString() === focusDomain)
      : domains;

    domainsToAnalyze.forEach((domain, domainIndex) => {
      prompt += `\n## Domain ${domainIndex + 1}: ${domain.title}\n`;
      prompt += `**Description**: ${domain.description || "N/A"}\n`;
      if (domain.predefinedAssessmentTitle) {
        prompt += `**Predefined assessment title (domain default)**: ${domain.predefinedAssessmentTitle}\n`;
      }
      if (domain.subDomains && domain.subDomains.length > 0) {
        prompt += `**Sub-domains**: ${domain.subDomains.join(", ")}\n`;
      }
      prompt += `\n### Expert Assessments:\n`;

      domain.assessments.forEach((assessment, assessmentIndex) => {
        prompt += `\n#### Assessment ${assessmentIndex + 1}: ${
          assessment.title
        }\n`;
        if (assessment.description) {
          prompt += `- Description: ${assessment.description}\n`;
        }
        if (assessment.fullName) {
          prompt += `- Expert: ${assessment.fullName}\n`;
        }
        prompt += `- Status: ${assessment.status}\n`;
        if (
          assessment.scoreAvg != null &&
          typeof assessment.scoreAvg === "number"
        ) {
          prompt += `- **Radio score average (1–5)**: ${assessment.scoreAvg} (mean of scored radio answers only)\n`;
        } else {
          prompt += `- **Radio score average (1–5)**: N/A (no radio-scored answers aggregated for this assessment)\n`;
        }
        if (
          assessment.scorePercentage != null &&
          typeof assessment.scorePercentage === "number"
        ) {
          prompt += `- **Readiness percentage (from radio scores)**: ${assessment.scorePercentage}% (derived as (scoreAvg/5)×100)\n`;
        } else {
          prompt += `- **Readiness percentage (from radio scores)**: N/A\n`;
        }
        prompt += `\n**Responses**:\n`;

        assessment.questions.forEach((qa, qaIndex) => {
          prompt += `${qaIndex + 1}. **Q**: ${qa.question}\n`;
          prompt += `   **A**: ${qa.answer}\n\n`;
        });
      });
    });

    prompt += `\n# ANALYSIS INSTRUCTIONS

You are conducting a national AI readiness assessment. Your analysis must synthesize two distinct evidence layers:

**Layer 1 — Expert Assessments**: The structured survey responses above, including scoreAvg (1–5 radio scale), scorePercentage (0–100), and free-text answers from domain experts.

**Layer 2 — OECD Policy Initiatives**: The linked governance initiatives, which represent the country's stated policy commitments, institutional arrangements, and implementation plans.

Your job is to reason across BOTH layers to produce:

A. **Current State Analysis**: What the expert assessments reveal about on-the-ground reality.
B. **Policy Alignment Check**: Where initiatives reinforce, contradict, or leave gaps relative to expert-reported reality.
C. **Recommendations**: Concrete policy actions derived from gaps between what experts say and what initiatives commit to.
D. **Score Improvement Roadmap**: Specific, measurable actions that would directly raise the readiness score for each domain.

For each domain, conduct analysis across these five lenses:
1. **Quantitative signals**: Use scoreAvg and scorePercentage as anchors. Flag any tension between numeric scores and free-text narrative (e.g. a high score but expert text revealing caveats, or vice versa).
2. **Expert consensus vs. divergence**: Do multiple experts agree? Where they diverge, treat it as a risk signal.
3. **Initiative coverage**: Which domains have strong initiative backing? Which are under-resourced by policy?
4. **Readiness gaps**: What specific capabilities are absent that would be needed to move from the current score to a higher band (e.g. Low to Medium, or Medium to High)?
5. **Quick wins vs. structural reforms**: Distinguish actions achievable in under 6 months from those requiring institutional change over 1–3 years.

# REQUIRED OUTPUT FORMAT

Respond ONLY with valid JSON. Do not include markdown code blocks, backticks, or any text outside the JSON.

{
  "overallReadiness": {
    "score": <number 0-100, weighted average across domains>,
    "level": "<Low|Medium|High>",
    "summary": "<3-4 sentence executive summary covering current state, key strengths, and the single most critical gap>",
    "confidenceLevel": "<High|Medium|Low>",
    "scoreDrivers": {
      "topBoostingDomains": ["<domain titles with highest scores>"],
      "topDraggingDomains": ["<domain titles with lowest scores pulling the overall down>"]
    }
  },
  "domainAssessments": [
    {
      "domainId": "<domain _id>",
      "domainTitle": "<domain title>",
      "readinessScore": <number 0-100>,
      "scoreBand": "<Low (0-39)|Medium (40-69)|High (70-100)>",
      "quantitativeSignal": {
        "scoreAvgAcrossAssessments": <number or null>,
        "scorePercentageAcrossAssessments": <number or null>,
        "narrativeAlignmentWithScore": "<Aligned|Overstated|Understated|Mixed — brief 1-sentence explanation>"
      },
      "strengths": [
        {
          "finding": "<specific strength>",
          "evidence": "<direct reference to expert response or initiative — reference key ideas, do not reproduce full sentences>"
        }
      ],
      "weaknesses": [
        {
          "finding": "<specific weakness or gap>",
          "impact": "<High|Medium|Low>",
          "evidence": "<supporting reference from assessments or initiative gaps>"
        }
      ],
      "initiativeAlignment": {
        "coverageLevel": "<Strong|Partial|Weak|None>",
        "alignedInitiatives": ["<initiative names that support this domain>"],
        "gaps": ["<specific policy commitments missing or insufficient for this domain>"]
      },
      "recommendations": [
        {
          "priority": "<High|Medium|Low>",
          "action": "<specific, concrete recommendation — start with an action verb>",
          "rationale": "<why this addresses a specific gap identified in assessments or initiatives>",
          "timeline": "<Short-term (0–6 months)|Medium-term (6–18 months)|Long-term (18+ months)>",
          "resourcesNeeded": "<budget tier (Low/Medium/High), key roles, or institutional actors required>",
          "expectedImpact": "<quantified where possible — e.g. would raise domain score by approximately 10–15 points by addressing X>",
          "linkedInitiative": "<name of OECD initiative this aligns with, or None — new initiative needed>"
        }
      ],
      "scoreImprovementRoadmap": {
        "currentScore": <readinessScore>,
        "targetScore": <realistic target score within 18 months>,
        "targetBand": "<Low|Medium|High>",
        "criticalBlockers": ["<what must be resolved first before score can improve>"],
        "quickWins": [
          {
            "action": "<action achievable within 6 months>",
            "estimatedScoreLift": "<e.g. +5 to +10 points>",
            "effort": "<Low|Medium|High>"
          }
        ],
        "structuralReforms": [
          {
            "action": "<longer-term institutional or policy change required>",
            "estimatedScoreLift": "<e.g. +15 to +25 points>",
            "timeHorizon": "<12–36 months>"
          }
        ]
      },
      "priorityLevel": "<High|Medium|Low>",
      "detailedAnalysis": "<comprehensive 3-paragraph analysis: paragraph 1 — current state based on expert evidence; paragraph 2 — policy initiative alignment and gaps; paragraph 3 — path to improvement and key dependencies>"
    }
  ],
  "crossCuttingThemes": [
    {
      "theme": "<theme name>",
      "description": "<explanation of the pattern observed across domains>",
      "affectedDomains": ["<domain titles>"],
      "policyImplication": "<what this means for overall national AI strategy>"
    }
  ],
  "initiativeLandscapeAnalysis": {
    "overallCoverage": "<Strong|Partial|Weak>",
    "wellCoveredAreas": ["<domains or topics with strong initiative backing>"],
    "underservedAreas": ["<domains or topics with weak or no initiative coverage>"],
    "initiativeQualitySignals": "<1-2 sentences on whether initiatives appear implementation-ready based on their action plans, monitoring mechanisms, and evaluation frameworks>",
    "recommendedNewInitiatives": [
      {
        "proposedFocus": "<topic or domain>",
        "rationale": "<gap it fills>",
        "suggestedType": "<Regulation|Strategy|Program|Research|Capacity Building|Other>"
      }
    ]
  },
  "keyFindings": [
    "<critical finding 1 — start with the domain or topic>",
    "<critical finding 2>",
    "<critical finding 3>",
    "<critical finding 4>",
    "<critical finding 5>"
  ],
  "riskFactors": [
    {
      "risk": "<risk description>",
      "severity": "<High|Medium|Low>",
      "affectedDomains": ["<domain titles>"],
      "mitigationStrategy": "<concrete mitigation recommendation>"
    }
  ],
  "nextSteps": [
    {
      "step": "<action — start with a verb>",
      "priority": "<High|Medium|Low>",
      "owner": "<suggested role, ministry, or department>",
      "timeline": "<timeframe>",
      "dependsOn": "<prerequisite step or condition, or None>"
    }
  ],
  "overallScoreImprovementSummary": {
    "currentOverallScore": <number>,
    "twelveMonthTarget": <realistic target if all high-priority quick wins are executed>,
    "thirtyMonthTarget": <realistic target if structural reforms are completed>,
    "topThreePriorityActions": [
      "<action 1 with highest combined impact and feasibility>",
      "<action 2>",
      "<action 3>"
    ]
  }
}`;

    return prompt;
  }

  /**
   * Estimates token count (rough approximation: 1 token ≈ 4 characters)
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Determines if policy data needs chunking
   * @param {Object} policyData - Policy data to check
   * @returns {Object} Analysis strategy info
   */
  determineAnalysisStrategy(policyData) {
    const prompt = this.buildAnalysisPrompt(policyData);
    const estimatedTokens = this.estimateTokens(prompt);

    return {
      estimatedTokens,
      needsChunking: estimatedTokens > this.SAFE_PROMPT_LIMIT,
      recommendedApproach:
        estimatedTokens > this.SAFE_PROMPT_LIMIT
          ? "domain-by-domain"
          : "full-analysis",
      domainCount: policyData.domains.length,
    };
  }

  /**
   * Calls Claude API to analyze policy
   * @param {string} prompt - Analysis prompt
   * @param {Object} options - API call options
   * @returns {Promise<Object>} Claude API response
   */
  async callClaudeAPI(prompt, options = {}) {
    this.validateConfig();

    const {
      useExtendedThinking = true,
      useCache = false,
      systemPrompt = null,
    } = options;

    const requestData = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: useExtendedThinking ? 1 : this.temperature,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    if (useExtendedThinking) {
      requestData.thinking = {
        type: "enabled",
        budget_tokens: this.thinkingBudget,
      };
    }

    if (systemPrompt) {
      requestData.system = systemPrompt;
    }

    try {
      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: 300000,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.error?.message ||
          error.response.data?.message ||
          "Claude API error";

        if (status === 401) {
          throw new CustomError(
            "Invalid Claude API key. Please check your CLAUDE_API_KEY configuration.",
            401,
          );
        } else if (status === 429) {
          throw new CustomError(
            "Claude API rate limit exceeded. Please try again later.",
            429,
          );
        } else if (status === 400) {
          throw new CustomError(`Claude API request error: ${message}`, 400);
        } else {
          throw new CustomError(
            `Claude API error (${status}): ${message}`,
            status,
          );
        }
      } else if (error.request) {
        throw new CustomError(
          "Failed to connect to Claude API. Please check your network connection.",
          503,
        );
      } else {
        throw new CustomError(
          `Error calling Claude API: ${error.message}`,
          500,
        );
      }
    }
  }

  /**
   * Parses Claude's response and extracts JSON analysis
   * @param {Object} claudeResponse - Response from Claude API
   * @returns {Object} Parsed analysis data
   */
  parseClaudeResponse(claudeResponse) {
    try {
      const content = claudeResponse.content;
      if (!content || !Array.isArray(content) || content.length === 0) {
        throw new CustomError("Invalid response format from Claude API", 500);
      }

      let text = null;
      for (const block of content) {
        if (block.type === "text") {
          text = block.text;
          break;
        }
      }

      if (!text) {
        throw new CustomError("No text content in Claude response", 500);
      }

      let jsonText = text.trim();

      jsonText = jsonText.replace(/```json\s?/g, "").replace(/```\s?/g, "");

      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
      }

      const analysis = JSON.parse(jsonText);

      if (!analysis.overallReadiness || !analysis.domainAssessments || !analysis.overallScoreImprovementSummary) {
        throw new CustomError(
          "Claude response missing required analysis fields",
          500,
        );
      }

      return {
        analysis,
        rawResponse: text,
        usage: claudeResponse.usage || null,
        thinkingUsed: content.some((block) => block.type === "thinking"),
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        `Failed to parse Claude response: ${
          error.message
        }. Raw response: ${claudeResponse.content?.[0]?.text?.substring(
          0,
          500,
        )}`,
        500,
      );
    }
  }

  /**
   * Analyzes a single domain in detail
   * @param {string} policyId - The policy ID
   * @param {string} domainId - The domain ID to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Domain analysis
   */
  async analyzeDomain(policyId, domainId, options = {}) {
    try {
      const policyData = await this.fetchPolicyData(policyId);

      const domain = policyData.domains.find(
        (d) => d._id.toString() === domainId,
      );
      if (!domain) {
        throw new CustomError("Domain not found in policy", 404);
      }

      const focusedData = {
        ...policyData,
        domains: [domain],
      };

      const prompt = this.buildAnalysisPrompt(focusedData, {
        focusDomain: domainId,
      });
      const claudeResponse = await this.callClaudeAPI(prompt, {
        useExtendedThinking: options.useExtendedThinking !== false,
      });
      const parsedResponse = this.parseClaudeResponse(claudeResponse);

      return {
        policyId,
        domainId,
        analysis: parsedResponse.analysis.domainAssessments[0],
        metadata: {
          model: this.model,
          tokensUsed: parsedResponse.usage?.output_tokens || null,
          tokensInput: parsedResponse.usage?.input_tokens || null,
          thinkingUsed: parsedResponse.thinkingUsed,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to analyze domain: ${error.message}`, 500);
    }
  }

  /**
   * Main method to analyze a policy and return AI readiness assessment
   * @param {string} policyId - The policy ID to analyze
   * @param {Object} options - Optional analysis parameters
   * @returns {Promise<Object>} Complete readiness analysis
   */
  async analyzePolicyReadiness(policyId, options = {}) {
    try {
      const policyData = await this.fetchPolicyData(policyId);

      const strategy = this.determineAnalysisStrategy(policyData);

      console.log(
        `Analysis strategy: ${strategy.recommendedApproach} (estimated ${strategy.estimatedTokens} tokens)`,
      );

      if (strategy.needsChunking && options.allowChunking !== false) {
        console.log("Large dataset detected. Analyzing domain by domain...");
        return await this.analyzePolicyByDomain(policyId, policyData, options);
      }

      const prompt = this.buildAnalysisPrompt(policyData);
      const claudeResponse = await this.callClaudeAPI(prompt, {
        useExtendedThinking: options.useExtendedThinking !== false,
      });
      const parsedResponse = this.parseClaudeResponse(claudeResponse);

      return {
        policyId: policyId,
        policy: policyData.policy,
        analysis: parsedResponse.analysis,
        metadata: {
          totalDomains: policyData.domains.length,
          totalAssessments: policyData.totalAssessments,
          totalQuestions: policyData.totalQuestions,
          totalInitiatives: policyData.totalInitiatives ?? 0,
          model: this.model,
          tokensUsed: parsedResponse.usage?.output_tokens || null,
          tokensInput: parsedResponse.usage?.input_tokens || null,
          thinkingUsed: parsedResponse.thinkingUsed,
          analysisStrategy: strategy.recommendedApproach,
          analyzedAt: new Date().toISOString(),
        },
        rawResponse: options.includeRaw
          ? parsedResponse.rawResponse
          : undefined,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        `Failed to analyze policy readiness: ${error.message}`,
        500,
      );
    }
  }

  /**
   * Analyzes policy domain by domain and synthesizes results
   * @param {string} policyId - The policy ID
   * @param {Object} policyData - Pre-fetched policy data
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Synthesized analysis
   */
  async analyzePolicyByDomain(policyId, policyData, options = {}) {
    const domainAnalyses = [];

    for (const domain of policyData.domains) {
      console.log(`Analyzing domain: ${domain.title}`);
      const domainAnalysis = await this.analyzeDomain(
        policyId,
        domain._id.toString(),
        options,
      );
      domainAnalyses.push(domainAnalysis.analysis);
    }

    const synthesisPrompt = `You are an expert AI policy analyst. Based on the following domain-specific analyses, provide an overall country readiness assessment.

${domainAnalyses
  .map(
    (da, idx) => `
Domain ${idx + 1}: ${da.domainTitle}
- Readiness Score: ${da.readinessScore}
- Key Strengths: ${da.strengths.map((s) => s.finding).join("; ")}
- Key Weaknesses: ${da.weaknesses.map((w) => w.finding).join("; ")}
- Priority: ${da.priorityLevel}
`,
  )
  .join("\n")}

Provide a synthesis in this JSON format:
{
  "overallReadiness": {
    "score": <average weighted score 0-100>,
    "level": "<Low|Medium|High>",
    "summary": "<executive summary>",
    "confidenceLevel": "<High|Medium|Low>"
  },
  "crossCuttingThemes": [{"theme": "", "description": "", "affectedDomains": []}],
  "keyFindings": ["<finding 1>", "<finding 2>"],
  "riskFactors": [{"risk": "", "severity": "", "mitigationStrategy": ""}],
  "nextSteps": [{"step": "", "priority": "", "owner": "", "timeline": ""}]
}`;

    const synthesisResponse = await this.callClaudeAPI(synthesisPrompt, {
      useExtendedThinking: false,
    });
    const synthesis = this.parseClaudeResponse(synthesisResponse);

    return {
      policyId,
      policy: policyData.policy,
      analysis: {
        ...synthesis.analysis,
        domainAssessments: domainAnalyses,
      },
      metadata: {
        totalDomains: policyData.domains.length,
        totalAssessments: policyData.totalAssessments,
        totalQuestions: policyData.totalQuestions,
        totalInitiatives: policyData.totalInitiatives ?? 0,
        model: this.model,
        analysisStrategy: "domain-by-domain",
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Quick readiness check - returns a simplified assessment
   * @param {string} policyId - The policy ID to analyze
   * @returns {Promise<Object>} Simplified readiness assessment
   */
  async quickReadinessCheck(policyId) {
    const fullAnalysis = await this.analyzePolicyReadiness(policyId, {
      useExtendedThinking: false,
      includeRaw: false,
    });

    return {
      policyId: fullAnalysis.policyId,
      overallReadiness: fullAnalysis.analysis.overallReadiness,
      domainScores: fullAnalysis.analysis.domainAssessments.map((d) => ({
        domainId: d.domainId,
        domainTitle: d.domainTitle,
        readinessScore: d.readinessScore,
        priorityLevel: d.priorityLevel,
      })),
      keyFindings: fullAnalysis.analysis.keyFindings,
      analyzedAt: fullAnalysis.metadata.analyzedAt,
    };
  }

  /**
   * Compare readiness across multiple policies
   * @param {Array<string>} policyIds - Array of policy IDs to compare
   * @returns {Promise<Object>} Comparative analysis
   */
  async comparePolicies(policyIds) {
    if (!Array.isArray(policyIds) || policyIds.length < 2) {
      throw new CustomError(
        "At least 2 policy IDs required for comparison",
        400,
      );
    }

    const analyses = await Promise.all(
      policyIds.map((id) => this.quickReadinessCheck(id)),
    );

    return {
      comparison: analyses,
      summary: {
        highestOverall: analyses.reduce((max, curr) =>
          curr.overallReadiness.score > max.overallReadiness.score ? curr : max,
        ),
        lowestOverall: analyses.reduce((min, curr) =>
          curr.overallReadiness.score < min.overallReadiness.score ? curr : min,
        ),
        averageScore:
          analyses.reduce((sum, curr) => sum + curr.overallReadiness.score, 0) /
          analyses.length,
      },
    };
  }
}

module.exports = ClaudeService;
