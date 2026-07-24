const db = require("./db");

const schemaSql = `
create table if not exists public.testimonials (
  id text primary key,
  name text not null,
  email text not null,
  company text not null default '',
  text text not null,
  rating integer not null check (rating between 1 and 5),
  photo_url text default null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  sentiment text default null,
  created_at timestamptz not null default timezone('utc', now())
);
`;

async function initDb() {
  try {
    await db.request({
      query: {
        select: "id",
        limit: 1,
      },
      headers: {
        Prefer: "count=exact",
      },
    });
  } catch (error) {
    const details = JSON.stringify(error.details || {});
    const missingTable =
      details.includes("testimonials") &&
      (details.includes("does not exist") || details.includes("relation"));

    if (missingTable) {
      throw new Error(
        "Supabase table `public.testimonials` does not exist. Create it in the Supabase SQL editor with this SQL:\n" +
          schemaSql.trim()
      );
    }

    throw new Error(`Failed to initialize Supabase connection: ${error.message}`);
  }
}

module.exports = {
  initDb,
  schemaSql,
};
