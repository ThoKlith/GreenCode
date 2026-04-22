import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type GithubRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ repos: [] });
    }

    const username = user.user_metadata?.user_name;
    if (!username) {
      return NextResponse.json({ repos: [] });
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=12&type=public`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'EcoCode-App',
        },
        next: { revalidate: 300 }, // cache for 5 min
      }
    );

    if (!response.ok) {
      return NextResponse.json({ repos: [] });
    }

    const data = (await response.json()) as GithubRepo[];

    const repos = data.map((repo) => ({
      name: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updated_at: repo.updated_at,
    }));

    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Repos fetch error:", error);
    return NextResponse.json({ repos: [] });
  }
}
