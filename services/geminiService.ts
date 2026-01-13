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
       - For each page, provide a specific, highly detailed image generation prompt suitable for creating a black-and-white coloring page or a cover design. 
       - Ensure the prompts explicitly mention "clean black and white line art", "coloring book style", "no shading" where appropriate.
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
    data.pages = data.pages.map((p: any, i: number) => ({...p, id: `page_${Date.now()}_${i}`}));
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

        return data.map((p: any, i: number) => ({...p, id: `auto_extra_${Date.now()}_${i}`, isCover: false}));
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
             specificInst = "Create prompts for FULL COLOR Sticker sheets. Cute, die-cut style, white borders.";
        } else {
             specificInst = "Create prompts for BLACK & WHITE LINE ART Sticker sheets (coloring stickers). Die-cut style, white borders.";
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
        return data;
    } catch (e) {
        console.error("Error regenerating page", e);
        throw e;
    }
}

export const generateAssetImage = async (
    prompt: string, 
    type: 'coloring_page' | 'cover' | 'sticker' | 'divider' | 'mockup',
    size: PublicationSize
): Promise<string> => {
  const ai = getClient();

  // --- STRICT STYLE ENFORCEMENT ---
  let enhancedPrompt = prompt;

  if (type === 'cover') {
      // Rule: All COVERS should be FULL COLOR
      // Rule: Do not add random author names.
      // Rule: Text is allowed if in the prompt (removed (NO TEXT) tag).
      enhancedPrompt = `(FULL COLOR ILLUSTRATION), (NO RANDOM AUTHOR NAMES), ${prompt}. vibrant colors, highly detailed professional book cover art, 8k resolution.`;
  } 
  else if (type === 'coloring_page' || type === 'divider') {
      // Rule: Inside pages must be B&W line art
      enhancedPrompt = `(STRICT BLACK AND WHITE LINE ART), (NO GRAYSCALE), (NO SHADING), (NO COLORS), ${prompt}. clean crisp vector lines, professional coloring book page, white background, high contrast, intricate details.`;
  } 
  else if (type === 'sticker') {
      // Stickers can be either, usually the prompt from the generator specifies "full color" or "line art". 
      // We add safety nets.
      enhancedPrompt = `${prompt}, sticker sheet design, thick white border around items, die-cut style, simple vector graphic, white background, organized layout.`;
  }

  // Determine aspect ratio based on publication size
  let aspectRatio = "1:1";
  if (size === 'Portrait (8.5x11)') {
      aspectRatio = "3:4";
  } else if (size === 'Landscape (11x8.5)') {
      aspectRatio = "4:3";
  }
  
  // Mockups often look better in landscape or square depending on the scene, defaulting to 1:1 or 4:3 is safe
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