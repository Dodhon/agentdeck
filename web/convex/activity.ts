import { queryGeneric } from "convex/server";

export const listActivity = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("activityLog").withIndex("by_createdAt").order("desc").collect();
  },
});
