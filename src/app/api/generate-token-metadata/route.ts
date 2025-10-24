import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with custom endpoint
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is set
    console.log('OpenAI API key exists:', !!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
    console.log('OpenAI API key length:', process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length || 0);
    console.log('OpenAI Base URL:', process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1');

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.log('OpenAI API key not set, using fallback metadata');
      return NextResponse.json({
        name: "AI Generated Meme Token",
        symbol: "AIMEME",
        description: "This token represents a unique AI-enhanced image created in 0rbit.",
        twitter: "https://twitter.com/aimemetoken",
        telegram: "https://t.me/aimemetoken",
        website: "https://aimeme.example.com"
      });
    }

    console.log('Calling OpenAI Vision API...');
    console.log('Image data length:', image.length);

    // Call OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Updated model name
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Generate metadata for a meme token based on this image. Provide a creative name, symbol (3-5 characters), description, and suggested social links (twitter, telegram, website). Format the response as JSON with these fields: name, symbol, description, twitter, telegram, website." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${image}`,
                detail: "low" // Use low detail to reduce image size
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    console.log('OpenAI API response received');

    // Extract and parse the JSON response
    const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI response content:', content);

    let metadata;

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON in response:', jsonMatch[0]);
        metadata = JSON.parse(jsonMatch[0]);
        console.log('Parsed metadata:', metadata);

        // Validate that we have the required fields
        if (!metadata.name || !metadata.symbol || !metadata.description) {
          console.log('Missing required fields in metadata, using fallback');
          throw new Error('Missing required fields');
        }
      } else {
        console.log('No JSON found in response, using fallback');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Using fallback metadata');
      // Fallback to default metadata
      metadata = {
        name: "AI Generated Meme Token",
        symbol: "AIMEME",
        description: "This token represents a unique AI-enhanced image created in 0rbit.",
        twitter: "https://twitter.com/aimemetoken",
        telegram: "https://t.me/aimemetoken",
        website: "https://aimeme.example.com"
      };
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating token metadata:', error);

    // Return fallback metadata instead of error
    const fallbackMetadata = {
      name: "AI Generated Meme Token",
      symbol: "AIMEME",
      description: "This token represents a unique AI-enhanced image created in 0rbit.",
      twitter: "https://twitter.com/aimemetoken",
      telegram: "https://t.me/aimemetoken",
      website: "https://aimeme.example.com"
    };

    return NextResponse.json(fallbackMetadata);
  }
}