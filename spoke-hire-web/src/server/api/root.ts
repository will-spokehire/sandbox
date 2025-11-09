import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { vehicleRouter } from "~/server/api/routers/vehicle";
import { userVehicleRouter } from "~/server/api/routers/user-vehicle";
import { publicVehicleRouter } from "~/server/api/routers/public-vehicle";
import { dealRouter } from "~/server/api/routers/deal";
import { mediaRouter } from "~/server/api/routers/media";
import { userRouter } from "~/server/api/routers/user";
import { makeRouter } from "~/server/api/routers/make";
import { modelRouter } from "~/server/api/routers/model";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  vehicle: vehicleRouter,
  userVehicle: userVehicleRouter,
  publicVehicle: publicVehicleRouter,
  deal: dealRouter,
  media: mediaRouter,
  user: userRouter,
  make: makeRouter,
  model: modelRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.auth.getSession();
 */
export const createCaller = createCallerFactory(appRouter);
