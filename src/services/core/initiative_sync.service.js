const axios = require("axios");
const logger = require("./logger.service");

const OECD_INITIATIVES_BASE_URL =
  "https://oecd-ai.case-api.buddyweb.fr/policy-initiatives";
const DEFAULT_PER_PAGE = 20;
/** Stale lock threshold: if sync started more than this ago, allow a new run */
const SYNC_LOCK_STALE_MS = 60 * 60 * 1000; // 1 hour
/** Max concurrent API requests when fetching pages */
const FETCH_CONCURRENCY = 10;
/** Max ops per bulkWrite to avoid oversized batches */
const BULK_WRITE_BATCH_SIZE = 250;

/**
 * Maps a single API initiative item to our Initiative document shape.
 */
function mapApiItemToInitiative(item) {
  const doc = {
    apiId: item.id,
    englishName: item.englishName ?? null,
    originalName: item.originalName ?? null,
    slug: item.slug != null ? String(item.slug).trim() || null : null,
    description: item.description ?? null,
    website: item.website ?? null,
    status: item.status ?? null,
    responsibleOrganisation: item.responsibleOrganisation ?? null,
    responsibleOrganisationSI: item.responsibleOrganisationSI ?? null,
    responsibleOrganisationSILocation: item.responsibleOrganisationSILocation ?? null,
    responsibleOrganisationSDLocation: item.responsibleOrganisationSDLocation ?? null,
    category: item.category ?? null,
    extentBinding: item.extentBinding ?? null,
    joint: item.joint ?? null,
    startYear: item.startYear ?? null,
    endYear: item.endYear === 0 ? null : item.endYear,
    overview: item.overview ?? null,
    actionPlan: item.actionPlan ?? null,
    budget: item.budget ?? null,
    budgetAvailable: item.budgetAvailable ?? null,
    isEvaluated: item.isEvaluated ?? null,
    evaluationBy: item.evaluationBy ?? null,
    otherEvaluationBy: item.otherEvaluationBy ?? null,
    evaluationUrls: item.evaluationUrls ?? [],
    evaluationDescription: item.evaluationDescription ?? null,
    isEvaluationResultsPubliclyAvailable: item.isEvaluationResultsPubliclyAvailable ?? null,
    relevantUrls: item.relevantUrls ?? [],
    engagementDescription: item.engagementDescription ?? null,
    hasMonitoringMechanism: item.hasMonitoringMechanism ?? null,
    monitoringMechanismDescription: item.monitoringMechanismDescription ?? null,
    videoUrl: item.videoUrl ?? null,
    moreInfos: item.moreInfos ?? null,
    trustworthyAIRelation: item.trustworthyAIRelation ?? null,
    intergovernmentalCoordination: item.intergovernmentalCoordination ?? null,
    trustworthyAIMechanismDescription: item.trustworthyAIMechanismDescription ?? null,
    otherEngagementMechanism: item.otherEngagementMechanism ?? null,
    otherInitiativeType: item.otherInitiativeType ?? null,
    createdByEmail: item.createdByEmail ?? null,
    createdByName: item.createdByName ?? null,
    updatedByEmail: item.updatedByEmail ?? null,
    updatedByName: item.updatedByName ?? null,
    publishedByEmail: item.publishedByEmail ?? null,
    publishedByName: item.publishedByName ?? null,
    editorialStatus: item.editorialStatus ?? null,
    apiCreatedAt: item.createdAt ? new Date(item.createdAt) : null,
    apiUpdatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
    gaiinCountry: item.gaiinCountry ?? null,
    intergovernmentalOrganisation: item.intergovernmentalOrganisation ?? null,
    images: item.images ?? [],
    sourceFiles: item.sourceFiles ?? [],
    evaluationFiles: item.evaluationFiles ?? [],
    relevantFiles: item.relevantFiles ?? [],
    targetSectors: item.targetSectors ?? [],
    initiativeType: item.initiativeType ?? null,
    principles: item.principles ?? [],
    tags: item.tags ?? [],
    gaiinCountryId: item.gaiinCountryId ?? null,
    intergovernmentalOrganisationId: item.intergovernmentalOrganisationId ?? null,
    isWarningHighlight: item.isWarningHighlight ?? false,
    isDisabledHighlight: item.isDisabledHighlight ?? false,
    isInfoHighlight: item.isInfoHighlight ?? false,
    isEditable: item.isEditable ?? false,
    isDeletable: item.isDeletable ?? false,
    isEditorialStatusUpdatable: item.isEditorialStatusUpdatable ?? false,
  };
  return doc;
}

/**
 * Fetches a single page from the OECD policy initiatives API.
 * @param {number} page - 1-based page number
 * @returns {Promise<{ data: any[], currentPage, lastPage, total, perPage }>}
 */
async function fetchPage(page) {
  const url = `${OECD_INITIATIVES_BASE_URL}?publishedOnly=true&page=${page}`;
  const { data } = await axios.get(url, { timeout: 30000 });
  return {
    data: data.data ?? [],
    currentPage: data.currentPage ?? page,
    lastPage: data.lastPage ?? 1,
    total: data.total ?? 0,
    perPage: data.perPage ?? DEFAULT_PER_PAGE,
  };
}

/**
 * Fetches multiple pages in parallel (bounded concurrency).
 * @param {number[]} pageNumbers - 1-based page numbers
 * @returns {Promise<Array<{ data: any[], currentPage, lastPage, total, perPage }>>}
 */
async function fetchPageBatch(pageNumbers) {
  return Promise.all(pageNumbers.map((p) => fetchPage(p)));
}

/**
 * Tries to acquire the sync lock so only one sync runs at a time.
 * @param {object} deps - { InitiativeSyncMeta }
 * @returns {Promise<boolean>} true if lock acquired
 */
async function acquireSyncLock(deps) {
  const { InitiativeSyncMeta } = deps;
  const staleThreshold = new Date(Date.now() - SYNC_LOCK_STALE_MS);
  const updated = await InitiativeSyncMeta.findOneAndUpdate(
    {
      $or: [
        { syncInProgress: { $ne: true } },
        { syncStartedAt: { $lt: staleThreshold } },
      ],
    },
    { $set: { syncInProgress: true, syncStartedAt: new Date() } },
    { upsert: true, new: true }
  );
  return !!updated;
}

/**
 * Releases the sync lock (call in finally after sync).
 * @param {object} deps - { InitiativeSyncMeta }
 */
async function releaseSyncLock(deps) {
  const { InitiativeSyncMeta } = deps;
  await InitiativeSyncMeta.updateOne(
    {},
    { $set: { syncInProgress: false } }
  );
}

/**
 * Builds bulkWrite ops from API items, deduping by slug (only first slug kept).
 * Mutates seenSlugs and returns ops array.
 */
function buildUpsertOps(items, seenSlugs) {
  const ops = [];
  for (const item of items) {
    const doc = mapApiItemToInitiative(item);
    const slugKey =
      doc.slug && String(doc.slug).trim() ? doc.slug.trim() : null;
    if (slugKey) {
      if (seenSlugs.has(slugKey)) continue;
      seenSlugs.add(slugKey);
    }
    const filter = slugKey ? { slug: slugKey } : { apiId: doc.apiId };
    ops.push({
      updateOne: {
        filter,
        update: { $set: doc },
        upsert: true,
      },
    });
  }
  return ops;
}

/**
 * Fetches all pages and upserts initiatives into the database.
 * Uses parallel API fetches and batched bulkWrite for speed.
 * @param {object} deps - { Initiative, InitiativeSyncMeta }
 * @param {object} [opts] - { onPageDone(currentPage, lastPage, total), firstPageResult }
 * @returns {Promise<{ totalFetched: number, totalInApi: number, lastPage: number }>}
 */
async function syncAllPages(deps, opts = {}) {
  const { Initiative, InitiativeSyncMeta } = deps;
  const { onPageDone, firstPageResult: providedFirst } = opts;

  const first = providedFirst ?? (await fetchPage(1));
  const totalInApi = first.total;
  const lastPage = first.lastPage;

  let totalUpserted = 0;
  const seenSlugs = new Set();
  let pendingOps = [];

  /** Flush pending ops to DB */
  const flushOps = async () => {
    if (pendingOps.length === 0) return;
    const bulkResult = await Initiative.bulkWrite(pendingOps, {
      ordered: false,
    });
    totalUpserted += bulkResult.upsertedCount + bulkResult.modifiedCount;
    pendingOps = [];
  };

  // Process first page (already fetched)
  const firstItems = first.data || [];
  if (firstItems.length > 0) {
    pendingOps.push(...buildUpsertOps(firstItems, seenSlugs));
    if (pendingOps.length >= BULK_WRITE_BATCH_SIZE) await flushOps();
  }
  if (typeof onPageDone === "function") {
    onPageDone(1, lastPage, totalInApi);
  }

  // Remaining pages (2..lastPage) in parallel chunks
  const pageNumbers = [];
  for (let p = 2; p <= lastPage; p++) pageNumbers.push(p);

  for (let i = 0; i < pageNumbers.length; i += FETCH_CONCURRENCY) {
    const chunk = pageNumbers.slice(i, i + FETCH_CONCURRENCY);
    const results = await fetchPageBatch(chunk);
    for (const result of results) {
      const items = result.data || [];
      if (items.length > 0) {
        pendingOps.push(...buildUpsertOps(items, seenSlugs));
        if (pendingOps.length >= BULK_WRITE_BATCH_SIZE) await flushOps();
      }
      if (typeof onPageDone === "function") {
        onPageDone(result.currentPage, lastPage, totalInApi);
      }
    }
  }

  await flushOps();

  await InitiativeSyncMeta.findOneAndUpdate(
    {},
    {
      $set: {
        lastApiTotal: totalInApi,
        lastSyncedAt: new Date(),
        lastPageFetched: lastPage,
      },
    },
    { upsert: true }
  );

  return { totalFetched: totalUpserted, totalInApi, lastPage };
}

/**
 * Checks if the API total has changed; if so, runs full sync. Used by cron.
 * Uses a lock so only one sync runs at a time (no overlapping runs, no duplication).
 * @param {object} deps - { Initiative, InitiativeSyncMeta }
 * @returns {Promise<{ synced: boolean, totalInApi?: number, totalFetched?: number }>}
 */
async function syncIfTotalChanged(deps) {
  const { Initiative, InitiativeSyncMeta } = deps;

  const lockAcquired = await acquireSyncLock(deps);
  if (!lockAcquired) {
    logger.info(
      "[InitiativeSync] Another sync is in progress or lock is held; skipping."
    );
    return { synced: false, skipped: "lock" };
  }

  try {
    const first = await fetchPage(1);
    const currentApiTotal = first.total;

    const meta = await InitiativeSyncMeta.findOne();
    const lastApiTotal = meta?.lastApiTotal ?? 0;

    if (currentApiTotal === lastApiTotal) {
      logger.info(
        `[InitiativeSync] Total unchanged (${currentApiTotal}). Skipping sync.`
      );
      return { synced: false, totalInApi: currentApiTotal };
    }

    logger.info(
      `[InitiativeSync] Total changed: ${lastApiTotal} -> ${currentApiTotal}. Starting full sync.`
    );

    const result = await syncAllPages(deps, {
      firstPageResult: first,
      onPageDone(currentPage, lastPage) {
        if (currentPage % 20 === 0 || currentPage === lastPage) {
          logger.info(
            `[InitiativeSync] Page ${currentPage}/${lastPage} done.`
          );
        }
      },
    });

    logger.info(
      `[InitiativeSync] Sync complete. Fetched ${result.totalFetched} initiatives (API total: ${result.totalInApi}).`
    );
    return {
      synced: true,
      totalInApi: result.totalInApi,
      totalFetched: result.totalFetched,
    };
  } finally {
    await releaseSyncLock(deps);
  }
}

module.exports = {
  fetchPage,
  mapApiItemToInitiative,
  syncAllPages,
  syncIfTotalChanged,
  OECD_INITIATIVES_BASE_URL,
};
