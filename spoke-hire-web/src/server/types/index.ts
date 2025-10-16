/**
 * Server Types Index
 * 
 * Central export point for all server-side types.
 * Import from here instead of individual files for consistency.
 * 
 * @example
 * import { ListParams, VehicleWithRelations, DealWithDetails } from "~/server/types";
 */

// Common types
export type {
  PaginationParams,
  PaginationResult,
  SortOrder,
  SortParams,
  ListParams,
  ListResult,
  SearchParams,
  FilterParams,
  OperationResult,
  IdParam,
  DateRangeFilter,
  NumericRangeFilter,
} from "./common";

// Database types
export type {
  DbClient,
  TransactionClient,
  FindManyOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
} from "./database";

// Vehicle types
export type {
  VehicleFilters,
  VehicleLocationFilters,
  ListVehiclesParams,
  VehicleWithRelations,
  ListVehiclesResult,
  UpdateVehicleData,
  VehicleFilterOptions,
} from "./vehicle";

// Deal types
export type {
  CreateDealParams,
  UpdateDealParams,
  SendDealParams,
  AddVehiclesToDealParams,
  ListDealsParams,
  DealVehicle,
  DealRecipient,
  DealWithDetails,
  DealSummary,
  CreateDealResult,
  SendDealResult,
  DealStats,
} from "./deal";

// User types
export type {
  SignInWithOtpParams,
  VerifyOtpParams,
  UserBasicInfo,
  UserWithDetails,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UserSession,
  UserFilters,
} from "./user";

// Email types
export type {
  EmailVehicleData,
  EmailRecipientData,
  SendDealEmailParams,
  EmailSendResult,
  EmailTemplateData,
  EmailConfig,
} from "./email";

// Media types
export type {
  ReorderImagesInput,
  DeleteImageInput,
  CreateMediaInput,
  MediaItem,
  UploadProgress,
  UploadResult,
} from "./media";

