// Backward-compat re-export. Time logic now lives in @wynnpool/shared.
// New code should import directly from "@wynnpool/shared".
export {
  WEEK_MS,
  getRaidpoolYearWeek,
  getFirstRaidpoolFridayUTC as getFirstFriday18UTC,
  getLootpoolYearWeek,
  getFirstLootpoolFridayUTC as getFirstFriday19UTC,
} from '@wynnpool/shared';
