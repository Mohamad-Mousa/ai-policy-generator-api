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
    this.Initiative = this.models.Initiative;
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
        500
      );
    }

    const validModels = [
      "claude-sonnet-4-20250514",
      "claude-sonnet-4-5-20250929",
      "claude-3-5-sonnet-20241022",
    ];

    if (!validModels.includes(this.model)) {
      console.warn(
        `Warning: Using non-standard model "${this.model}". Recommended: claude-sonnet-4-20250514`
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
    })
      .populate({
        path: "domains",
        match: { isDeleted: false, isActive: true },
        select: "_id title description subDomains",
      })
      .populate({
        path: "assessments",
        match: { isDeleted: false, isActive: true },
        select: "_id title description fullName status domain questions",
      })
      .lean();

    if (!policy) {
      throw new CustomError("Policy not found", 404);
    }

    policy.domains = policy.domains.filter((d) => d !== null);
    policy.assessments = policy.assessments.filter((a) => a !== null);

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
      .select("_id question domain")
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
        sector: policy.sector,
        organizationSize: policy.organizationSize,
        riskAppetite: policy.riskAppetite,
        implementationTimeline: policy.implementationTimeline,
      },
      domains: Array.from(domainMap.values()),
      totalAssessments: policy.assessments.length,
      totalQuestions: questions.length,
    };
  }

  /**
   * Fetches policy data for initiative-based policies (initiatives only, no assessments/domains)
   * @param {string} policyId - The policy ID to analyze
   * @returns {Promise<Object>} Structured initiative data for analysis
   */
  async fetchInitiativePolicyData(policyId) {
    const policy = await this.Policy.findOne({
      _id: this.ObjectId(policyId),
      isDeleted: false,
      source: "initiative",
    })
      .populate({
        path: "initiatives",
        select:
          "englishName originalName slug description overview actionPlan category status responsibleOrganisation startYear endYear targetSectors initiativeType principles tags evaluationDescription monitoringMechanismDescription",
      })
      .lean();

    if (!policy) {
      throw new CustomError("Policy not found or is not an initiative-based policy", 404);
    }

    const initiatives = (policy.initiatives || []).filter((i) => i !== null);

    if (initiatives.length === 0) {
      throw new CustomError("Policy has no valid initiatives", 400);
    }

    return {
      policy: { _id: policy._id },
      initiatives,
      totalInitiatives: initiatives.length,
    };
  }

  /**
   * Builds a prompt for Claude to analyze initiative(s) and produce policy-style readiness analysis
   * @param {Object} initiativeData - From fetchInitiativePolicyData
   * @returns {string} Formatted prompt
   */
  buildInitiativeAnalysisPrompt(initiativeData) {
    const { initiatives } = initiativeData;

    let prompt = `You are an expert AI policy analyst specializing in national and international AI governance initiatives. Your task is to analyze the following AI policy initiative(s) and provide an evidence-based readiness and impact assessment.

# INITIATIVES TO ANALYZE

`;

    initiatives.forEach((init, idx) => {
      prompt += `\n## Initiative ${idx + 1}: ${init.englishName || init.originalName || "Unnamed"}\n`;
      if (init.description) prompt += `**Description**: ${init.description}\n`;
      if (init.overview) prompt += `**Overview**: ${init.overview}\n`;
      if (init.actionPlan) prompt += `**Action Plan**: ${init.actionPlan}\n`;
      if (init.category) prompt += `**Category**: ${init.category}\n`;
      if (init.status) prompt += `**Status**: ${init.status}\n`;
      if (init.responsibleOrganisation) prompt += `**Responsible Organisation**: ${init.responsibleOrganisation}\n`;
      if (init.startYear != null || init.endYear != null) {
        prompt += `**Timeframe**: ${init.startYear ?? "?"} - ${init.endYear ?? "ongoing"}\n`;
      }
      if (init.targetSectors && (Array.isArray(init.targetSectors) ? init.targetSectors.length : 0)) {
        const sectors = Array.isArray(init.targetSectors)
          ? init.targetSectors.map((s) => (typeof s === "object" ? s?.value ?? s?.name : s)).filter(Boolean)
          : [init.targetSectors];
        prompt += `**Target Sectors**: ${sectors.join(", ")}\n`;
      }
      if (init.principles && (Array.isArray(init.principles) ? init.principles.length : 0)) {
        const principles = Array.isArray(init.principles)
          ? init.principles.map((p) => (typeof p === "object" ? p?.value ?? p?.name : p)).filter(Boolean)
          : [init.principles];
        prompt += `**Principles**: ${principles.join(", ")}\n`;
      }
      if (init.evaluationDescription) prompt += `**Evaluation**: ${init.evaluationDescription}\n`;
      if (init.monitoringMechanismDescription) prompt += `**Monitoring**: ${init.monitoringMechanismDescription}\n`;
      prompt += "\n";
    });

    prompt += `# ANALYSIS INSTRUCTIONS

Conduct a thorough analysis based only on the initiative(s) above. Do not refer to or use any domains or assessments—only the initiative content provided.

Consider:
1. Alignment with trustworthy AI and governance best practices
2. Clarity of objectives, action plans, and monitoring
3. Gaps, risks, and opportunities for improvement
4. Comparative strengths across the initiatives (if multiple)
5. Actionable recommendations for implementation or adoption

Produce an overall readiness/impact score and structured findings. For the thematic sections (see output format), use initiative-based themes only—e.g. by category or key area such as "Governance", "Implementation", "Monitoring"—one entry per logical theme.

# REQUIRED OUTPUT FORMAT

Respond ONLY with valid JSON. Do not include markdown code blocks or any text outside the JSON structure.

{
  "overallReadiness": {
    "score": <number 0-100>,
    "level": "<Low|Medium|High>",
    "summary": "<2-3 sentence executive summary>",
    "confidenceLevel": "<High|Medium|Low>"
  },
  "domainAssessments": [
    {
      "domainId": "<theme identifier>",
      "domainTitle": "<theme name, e.g. Governance, Implementation>",
      "readinessScore": <number 0-100>,
      "strengths": [{"finding": "<strength>", "evidence": "<reference>"}],
      "weaknesses": [{"finding": "<weakness>", "impact": "<High|Medium|Low>", "evidence": "<reference>"}],
      "recommendations": [{"priority": "<High|Medium|Low>", "action": "<action>", "timeline": "<Short-term|Medium-term|Long-term>", "resourcesNeeded": "<brief>", "expectedImpact": "<brief>"}],
      "priorityLevel": "<High|Medium|Low>",
      "detailedAnalysis": "<1-2 paragraph analysis>"
    }
  ],
  "crossCuttingThemes": [{"theme": "<name>", "description": "<explanation>", "affectedDomains": ["<theme names>"]}],
  "keyFindings": ["<finding 1>", "<finding 2>"],
  "riskFactors": [{"risk": "<description>", "severity": "<High|Medium|Low>", "mitigationStrategy": "<recommendation>"}],
  "nextSteps": [{"step": "<action>", "priority": "<High|Medium|Low>", "owner": "<suggested role>", "timeline": "<timeframe>"}]
}`;

    return prompt;
  }

  /**
   * Analyzes initiative-based policy and returns readiness assessment (same structure as assessment-based analysis)
   * @param {string} policyId - The policy ID (must have source "initiative" and populated initiatives)
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} { analysis, metadata }
   */
  async analyzeInitiativeReadiness(policyId, options = {}) {
    try {
      const initiativeData = await this.fetchInitiativePolicyData(policyId);
      const prompt = this.buildInitiativeAnalysisPrompt(initiativeData);
      const claudeResponse = await this.callClaudeAPI(prompt, {
        useExtendedThinking: options.useExtendedThinking !== false,
      });
      const parsedResponse = this.parseClaudeResponse(claudeResponse);

      return {
        policyId,
        analysis: parsedResponse.analysis,
        metadata: {
          totalInitiatives: initiativeData.totalInitiatives,
          totalDomains: 0,
          totalAssessments: 0,
          totalQuestions: 0,
          model: this.model,
          tokensUsed: parsedResponse.usage?.output_tokens || null,
          tokensInput: parsedResponse.usage?.input_tokens || null,
          thinkingUsed: parsedResponse.thinkingUsed,
          analysisStrategy: "full-analysis",
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        `Failed to analyze initiative readiness: ${error.message}`,
        500
      );
    }
  }

  /**
   * Quick readiness check for initiative-based policy
   * @param {string} policyId - The policy ID to analyze
   * @returns {Promise<Object>} Simplified readiness (overallReadiness, keyFindings, etc.)
   */
  async quickInitiativeReadinessCheck(policyId) {
    const full = await this.analyzeInitiativeReadiness(policyId, {
      useExtendedThinking: false,
    });
    return {
      policyId: full.policyId,
      overallReadiness: full.analysis.overallReadiness,
      domainScores: (full.analysis.domainAssessments || []).map((d) => ({
        domainId: d.domainId,
        domainTitle: d.domainTitle,
        readinessScore: d.readinessScore,
        priorityLevel: d.priorityLevel,
      })),
      keyFindings: full.analysis.keyFindings || [],
      analyzedAt: full.metadata.analyzedAt,
    };
  }

  /**
   * Builds a comprehensive prompt for Claude to analyze policy readiness
   * @param {Object} policyData - Structured policy data
   * @param {Object} options - Analysis options
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(policyData, options = {}) {
    const { policy, domains } = policyData;
    const { focusDomain = null } = options;

    let prompt = `You are an expert AI policy analyst specializing in national AI readiness assessments. Your task is to analyze expert survey data and provide evidence-based, actionable recommendations.

# POLICY CONTEXT
- **Sector**: ${policy.sector}
- **Organization Size**: ${policy.organizationSize}
- **Risk Appetite**: ${policy.riskAppetite}
- **Implementation Timeline**: ${policy.implementationTimeline}

# EXPERT ASSESSMENT DATA

`;

    const domainsToAnalyze = focusDomain
      ? domains.filter((d) => d._id.toString() === focusDomain)
      : domains;

    domainsToAnalyze.forEach((domain, domainIndex) => {
      prompt += `\n## Domain ${domainIndex + 1}: ${domain.title}\n`;
      prompt += `**Description**: ${domain.description || "N/A"}\n`;
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
        prompt += `\n**Responses**:\n`;

        assessment.questions.forEach((qa, qaIndex) => {
          prompt += `${qaIndex + 1}. **Q**: ${qa.question}\n`;
          prompt += `   **A**: ${qa.answer}\n\n`;
        });
      });
    });

    prompt += `\n# ANALYSIS INSTRUCTIONS

Conduct a thorough analysis considering:
1. Expert consensus and disagreements across responses
2. Evidence of existing capabilities vs. gaps
3. Alignment with stated risk appetite and timeline
4. Industry best practices and benchmarks
5. Interdependencies between domains

For each domain, provide:
- **Readiness Score** (0-100): Justified assessment
- **Strengths**: Specific capabilities and positive indicators (cite expert responses)
- **Weaknesses**: Critical gaps with risk assessment
- **Recommendations**: Prioritized, actionable steps with timelines
- **Priority Level**: High/Medium/Low based on impact and urgency

# REQUIRED OUTPUT FORMAT

Respond ONLY with valid JSON. Do not include markdown code blocks or any text outside the JSON structure.

{
  "overallReadiness": {
    "score": <number 0-100>,
    "level": "<Low|Medium|High>",
    "summary": "<2-3 sentence executive summary>",
    "confidenceLevel": "<High|Medium|Low>"
  },
  "domainAssessments": [
    {
      "domainId": "<domain _id>",
      "domainTitle": "<domain title>",
      "readinessScore": <number 0-100>,
      "strengths": [
        {
          "finding": "<specific strength>",
          "evidence": "<supporting quote or reference from expert responses>"
        }
      ],
      "weaknesses": [
        {
          "finding": "<specific weakness>",
          "impact": "<High|Medium|Low>",
          "evidence": "<supporting reference>"
        }
      ],
      "recommendations": [
        {
          "priority": "<High|Medium|Low>",
          "action": "<specific recommendation>",
          "timeline": "<Short-term|Medium-term|Long-term>",
          "resourcesNeeded": "<brief description>",
          "expectedImpact": "<description>"
        }
      ],
      "priorityLevel": "<High|Medium|Low>",
      "detailedAnalysis": "<comprehensive 2-3 paragraph analysis>"
    }
  ],
  "crossCuttingThemes": [
    {
      "theme": "<theme name>",
      "description": "<explanation>",
      "affectedDomains": ["<domain titles>"]
    }
  ],
  "keyFindings": [
    "<critical finding 1>",
    "<critical finding 2>"
  ],
  "riskFactors": [
    {
      "risk": "<risk description>",
      "severity": "<High|Medium|Low>",
      "mitigationStrategy": "<recommendation>"
    }
  ],
  "nextSteps": [
    {
      "step": "<action>",
      "priority": "<High|Medium|Low>",
      "owner": "<suggested role/department>",
      "timeline": "<timeframe>"
    }
  ]
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
            401
          );
        } else if (status === 429) {
          throw new CustomError(
            "Claude API rate limit exceeded. Please try again later.",
            429
          );
        } else if (status === 400) {
          throw new CustomError(`Claude API request error: ${message}`, 400);
        } else {
          throw new CustomError(
            `Claude API error (${status}): ${message}`,
            status
          );
        }
      } else if (error.request) {
        throw new CustomError(
          "Failed to connect to Claude API. Please check your network connection.",
          503
        );
      } else {
        throw new CustomError(
          `Error calling Claude API: ${error.message}`,
          500
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

      if (!analysis.overallReadiness || !analysis.domainAssessments) {
        throw new CustomError(
          "Claude response missing required analysis fields",
          500
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
          500
        )}`,
        500
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
        (d) => d._id.toString() === domainId
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
        `Analysis strategy: ${strategy.recommendedApproach} (estimated ${strategy.estimatedTokens} tokens)`
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
        500
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
        options
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
`
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
        400
      );
    }

    const analyses = await Promise.all(
      policyIds.map((id) => this.quickReadinessCheck(id))
    );

    return {
      comparison: analyses,
      summary: {
        highestOverall: analyses.reduce((max, curr) =>
          curr.overallReadiness.score > max.overallReadiness.score ? curr : max
        ),
        lowestOverall: analyses.reduce((min, curr) =>
          curr.overallReadiness.score < min.overallReadiness.score ? curr : min
        ),
        averageScore:
          analyses.reduce((sum, curr) => sum + curr.overallReadiness.score, 0) /
          analyses.length,
      },
    };
  }
}

module.exports = ClaudeService;
