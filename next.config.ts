import type { NextConfig } from "next";

// works: `next.config.ts` is in the project root
import { greeting } from "@/lib/greeting";

const config: NextConfig = {
	env: { GREETING: greeting },
};

export default config;
