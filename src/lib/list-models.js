async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach((m) => {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name}`);
      }
    });
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
