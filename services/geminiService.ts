import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectPlan, PublicationSize, GeneratedPage } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helper: Robust JSON Parsing ---
const parseGeminiJson = (text: string | undefined): any => {
    if (!text) return null;
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // 2. Try stripping markdown code blocks
        const match = text.match(/```json([\s\S]*?)```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e2) {
                console.error("Failed to parse JSON content block");
            }
        }
        // 3. Try finding the first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            try {
                 return JSON.parse(text.substring(start, end + 1));
            } catch (e3) {
                 // 4. Try array format
                const startArr = text.indexOf('[');
                const endArr = text.lastIndexOf(']');
                if (startArr !== -1 && endArr !== -1) {
                    return JSON.parse(text.substring(startArr, endArr + 1));
                }
            }
        }
        console.error("JSON Parse failed completely for:", text);
        return null;
    }
};

export const generateProjectPlan = async (
  type: string,
  theme: string,
  audience: string,
  style: string,
  size: string
): Promise<ProjectPlan> => {
  const ai = getClient();
  
  const prompt = `
    Act as a professional creative director for a publishing company.
    Create a detailed project plan for a "${type}" centered around the theme/concept of "${theme}".
    It is designed specifically for "${audience}" and features a "${style}" art style.
    The publication format is "${size}".
    
    The plan must include:
    1. A catchy Project Title.
    2. A high-level Concept description integrating the "${theme}".
    3. 3-5 Color Palette suggestions (descriptive).
    4. A list of 5-8 specific pages/sections to include (e.g., Cover, Daily Spread, Habit Tracker, Quote Page). 
       - For each page, provide a specific, highly detailed image generation prompt.
       - IMPORTANT: For the 'Cover', the prompt MUST specify "Full Color, Vibrant".
       - IMPORTANT: For internal pages, the prompt MUST specify "Clean black and white line art, coloring book style".
    5. 3 specific Monetization strategies (e.g., bundles, digital vs physical, etsy tips).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      projectTitle: { type: Type.STRING },
      concept: { type: Type.STRING },
      colorPaletteSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            isCover: { type: Type.BOOLEAN, description: "True if this is the main cover" }
          },
          required: ["name", "description", "imagePrompt"]
        }
      },
      monetizationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["projectTitle", "concept", "pages", "monetizationStrategies"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const data = parseGeminiJson(response.text);
    if (!data) throw new Error("Failed to parse AI response");

    // Add IDs to pages for easier React key management
    // Set default renderMode based on isCover
    data.pages = data.pages.map((p: any, i: number) => ({
        ...p, 
        id: `page_${Date.now()}_${i}`,
        renderMode: p.isCover ? 'color' : 'line_art'
    }));
    return data as ProjectPlan;
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

export const generateAdditionalPages = async (
  plan: ProjectPlan,
  existingPageNames: string[]
): Promise<GeneratedPage[]> => {
    const ai = getClient();
    const prompt = `
        Context: Creating a "${plan.projectTitle}" which is a planner/journal.
        Concept: ${plan.concept}
        
        Existing Pages: ${existingPageNames.join(', ')}.
        
        Task: Create 3 NEW, UNIQUE page ideas that fit this project theme but are NOT duplicates of existing pages.
        Provide a name, description, and detailed image prompt for each.
        Assume these are internal coloring/planning pages (Black and White Line Art).
    `;

    const responseSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                isCover: { type: Type.BOOLEAN, description: "False" }
            },
            required: ["name", "description", "imagePrompt"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const data = parseGeminiJson(response.text);
        if (!data) return [];

        return data.map((p: any, i: number) => ({
            ...p, 
            id: `auto_extra_${Date.now()}_${i}`, 
            isCover: false,
            renderMode: 'line_art'
        }));
    } catch (e) {
        console.error("Error generating additional pages", e);
        return [];
    }
};

export const generateCreativePrompts = async (
    plan: ProjectPlan,
    type: 'cover' | 'page' | 'sticker',
    styleMode: 'color' | 'line_art',
    customInstructions: string = "",
    count: number = 5
): Promise<{title: string, prompt: string}[]> => {
    const ai = getClient();
    
    let specificInst = "";
    if (type === 'cover') {
        specificInst = "Create prompts for FULL COLOR book covers. Vibrant, eye-catching. NO TEXT, NO AUTHOR NAMES on the art.";
    } else if (type === 'page') {
        specificInst = "Create prompts for INTERIOR COLORING PAGES. Black and white, clean line art, no shading, high contrast.";
    } else if (type === 'sticker') {
        if (styleMode === 'color') {
             specificInst = "Create prompts for FULL COLOR Sticker sheets. Cute, die-cut style, white borders, vibrant colors.";
        } else {
             specificInst = "Create prompts for BLACK & WHITE LINE ART Sticker sheets (coloring stickers). Die-cut style, white borders, no fill.";
        }
    }

    const prompt = `
        Context: Project "${plan.projectTitle}" (${plan.concept}).
        Task: Generate ${count} distinct image prompts for: ${type.toUpperCase()}.
        Base Style: ${specificInst}
        Additional User Instructions: ${customInstructions}
        Focus on unique angles, details, or complementary scenes.
    `;

    const responseSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                prompt: { type: Type.STRING }
            },
            required: ["title", "prompt"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: responseSchema
            }
        });
        
        const data = parseGeminiJson(response.text);
        return data || [];
    } catch(e) {
        console.error("Error generating creative prompts", e);
        return [];
    }
};

export const regeneratePageConcept = async (
    plan: ProjectPlan,
    currentName: string
): Promise<GeneratedPage> => {
    const ai = getClient();
    const prompt = `
        Context: Creating a "${plan.projectTitle}".
        Task: Provide a fresh, alternative concept for a page similar to "${currentName}" or a completely new idea that fits the theme well.
        Return a single page object with name, description, and imagePrompt.
    `;

    const responseSchema: Schema = {
         type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            isCover: { type: Type.BOOLEAN }
          },
          required: ["name", "description", "imagePrompt"]
    };

    try {
        const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt,
             config: {
                 responseMimeType: "application/json",
                 responseSchema: responseSchema
             }
        });
        const data = parseGeminiJson(response.text);
        if (!data) throw new Error("No data");
        // Inherit default B&W unless cover
        return { ...data, renderMode: data.isCover ? 'color' : 'line_art' };
    } catch (e) {
        console.error("Error regenerating page", e);
        throw e;
    }
}

export const generateAssetImage = async (
    prompt: string, 
    type: 'coloring_page' | 'cover' | 'sticker' | 'divider' | 'mockup',
    size: PublicationSize,
    renderMode?: 'color' | 'line_art'
): Promise<string> => {
  const ai = getClient();

  // --- STRICT STYLE ENFORCEMENT ---
  let enhancedPrompt = prompt;

  // Define Strong Directives
  const COLOR_DIRECTIVES = "(FULL COLOR VIBRANT ILLUSTRATION), (NO BLACK AND WHITE), (NO OUTLINE ONLY), (RICH COLORS), (professional illustration), (NO RANDOM AUTHOR NAMES)";
  const LINE_ART_DIRECTIVES = "(STRICT BLACK AND WHITE LINE ART), (NO COLORS), (NO GRAYSCALE), (NO SHADING), (clean crisp vector lines), (white background), (high contrast)";

  // Determine effective mode
  let effectiveMode = renderMode;
  if (!effectiveMode) {
      // Fallbacks if not specified
      if (type === 'cover') effectiveMode = 'color';
      else effectiveMode = 'line_art';
  }

  // FORCE OVERRIDES based on request requirements
  if (type === 'cover') {
      // If user specifically asked for line art cover, we respect it, otherwise FORCE color
      if (effectiveMode === 'line_art') {
           enhancedPrompt = `${LINE_ART_DIRECTIVES}, book cover design, ${prompt}`;
      } else {
           enhancedPrompt = `${COLOR_DIRECTIVES}, book cover design, 8k resolution, ${prompt}`;
      }
  } 
  else if (type === 'sticker') {
      // Sticker logic
      if (effectiveMode === 'color') {
          enhancedPrompt = `${COLOR_DIRECTIVES}, sticker sheet design, thick white border around items, die-cut style, simple vector graphic, white background, organized layout, ${prompt}`;
      } else {
          enhancedPrompt = `${LINE_ART_DIRECTIVES}, sticker sheet design, thick white border around items, die-cut style, simple vector graphic, white background, organized layout, ${prompt}`;
      }
  }
  else {
      // Coloring Pages / Dividers / Default
      if (effectiveMode === 'color') {
          enhancedPrompt = `${COLOR_DIRECTIVES}, ${prompt}`;
      } else {
          enhancedPrompt = `${LINE_ART_DIRECTIVES}, professional coloring book page, intricate details, ${prompt}`;
      }
  }

  // Determine aspect ratio based on publication size
  let aspectRatio = "1:1";
  if (size === 'Portrait (8.5x11)') {
      aspectRatio = "3:4";
  } else if (size === 'Landscape (11x8.5)') {
      aspectRatio = "4:3";
  }
  
  if (type === 'mockup') {
      aspectRatio = "4:3"; 
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
      config: {
        imageConfig: {
            aspectRatio: aspectRatio as any
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const generateMockup = async (
    imageBase64: string,
    scenePrompt: string
): Promise<string> => {
    const ai = getClient();
    
    const prompt = `Generate a high-quality, photorealistic product mockup. 
    Scene: ${scenePrompt}.
    The product being shown is a coloring book or planner page.
    Use the visual style and content of the provided image as the design printed on the paper in the scene.
    Make it look professional, like an Etsy product listing photo.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: imageBase64.split(',')[1] // remove data:image/png;base64, prefix
                        }
                    },
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "4:3"
                }
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No mockup generated");
    } catch (e) {
        console.error("Mockup generation failed", e);
        throw e;
    }
}