# Load environment variables from .env file
foreach($line in Get-Content .env) {
    if ($line -match "([^=]*)=(.*)") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# Set the service role key
[Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqeGt2eHBxeXBxeGJwbmxqbXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjMwNzE4MCwiZXhwIjoyMDI3ODgzMTgwfQ.Wd0EuPtB9w9uYqz5CvD7Ks0jC_UL2dqN9_9HGhF5_Oc')

# Run the import script
node src/scripts/importPatterns.js 