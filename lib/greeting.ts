// fails: `@/lib/name` is rewritten to `./lib/name`, which resolves to `lib/lib/name`
import { name } from "@/lib/name";

export const greeting = `Hello, ${name}!`;
