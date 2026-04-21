-- Create the search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  energy_class VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'F', 'G'
  co2_estimate DECIMAL NOT NULL,
  efficiency_score INTEGER NOT NULL,
  ai_optimization_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history
CREATE POLICY "Users can only select their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can only insert into their own history
CREATE POLICY "Users can only insert into their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own history
CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history(user_id);

-- Create the local_reports table for the CLI app
CREATE TABLE IF NOT EXISTS public.local_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  energy_class VARCHAR(5) NOT NULL,
  co2_estimate DECIMAL NOT NULL,
  efficiency_score INTEGER NOT NULL,
  ai_optimization_score INTEGER NOT NULL,
  snippets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) for local_reports
ALTER TABLE public.local_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a new local report anonymously (CLI usage)
CREATE POLICY "Anyone can insert local reports" 
  ON public.local_reports 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Anyone can read a local report if they have the ID (UUID)
CREATE POLICY "Anyone can read local reports by id" 
  ON public.local_reports 
  FOR SELECT 
  USING (true);
