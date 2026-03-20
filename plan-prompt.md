Thoroughly read all of `docs/01-goal.md` and `app/types/database.ts` to understand what the theater times app should do and all its specificities.

When that's done, research the technologies used further - next.js and supabase - use context7 to help research.

Then, write an iterative, simple, and concise 02-plan.md with the following steps, and differentiate when I need to do something manually (supabase GUI) and when you (Claude) can do something.

First, we need to worry about the skeleton and auth - like setting up src/lib/supabase/client.ts and /supabase/server.ts ( createBrowserClient<database> and createServerClient<database> )

For auth, keep it super simple and follow supabase best practices via supabase auth - one server action, two fields, done simply.


Then, let's focus on the main read path - a test for connecting next and supabase, real data in the browser. I want to see all existing data on the homescreen as a server component, query supabase directly. No need for loading states, client hooks, or abstractions yet.

Then, main write path — core mutations end to end. Build the server action for the thing theater times actually does, replacing the "existing data" with the new data, and then maybe an RPC function so the old data is turned into an archived data object with a timestamp.

All data is owned by us, so trust the generated types. No zod needed.

Need to be able to submit the form, open supabase, see in the table editor changes were made, confirm the row exists, and then come back to browser and confirm it renders.

Once that is done, let's focus on the secondary surfaces and features like the editing of the data in the data normalization screen. Focus on this feature here and only here. I imagine the flow is submit data -> server normalizes via RPC function -> user views the first draft of normalized data client side -> user makes changes that persist client side -> when submitting/approving, server action handles the data mutation, and rpc function controls the change from "new data in, existing data archived".

After the secondary features are created, let's do a pass of styling (layout, typography, one accent color). No component library, simple if any design system.

Then create a suite of end-to-end walkthroughs to manually test.
