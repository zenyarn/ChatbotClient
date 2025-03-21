import { clerkMiddleware } from "@clerk/nextjs/server";

// 这个导出必须是默认导出
export default clerkMiddleware();

// 这个配置告诉 Next.js 哪些路由需要运行中间件
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 