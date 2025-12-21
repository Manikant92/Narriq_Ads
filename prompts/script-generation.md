# Ad Script Generation Prompt

Create a {{duration}} second video advertisement script for the following brand:

## Brand Information
- **Brand Name:** {{brandName}}
- **Tagline:** {{tagline}}
- **Tone:** {{tone}}
- **Target Audience:** {{audience}}
- **Industry:** {{industry}}
- **Key Messages:** {{keyMessages}}
- **Call to Action:** {{callToAction}}

## Format Requirements
- **Aspect Ratio:** {{aspectRatio}}
- **Total Duration:** {{duration}} seconds

## Script Guidelines

### Opening Hook (First 3 seconds)
- Grab attention immediately
- Use a compelling visual or statement
- Establish brand presence

### Value Proposition (Middle section)
- Clearly communicate the main benefit
- Show, don't just tell
- Use emotional connection appropriate for {{tone}} tone

### Call to Action (Final 5 seconds)
- Clear, actionable CTA: "{{callToAction}}"
- Include brand logo
- Create urgency without being pushy

## Scene Structure
Create 4-6 scenes with the following for each:
1. **Scene Number** - Sequential ordering
2. **Duration** - Time in seconds (4-8 seconds each)
3. **Visual Description** - What should be shown on screen
4. **Text Overlay** - Optional on-screen text
5. **Voiceover** - Narrator script
6. **Transition** - How to move to next scene (cut, fade, dissolve, slide)
7. **Camera Motion** - Movement type (static, zoom-in, zoom-out, pan-left, pan-right)

## Tone Guidelines

### Professional
- Clear, confident language
- Focus on credibility and expertise
- Measured pacing

### Casual
- Conversational, friendly language
- Relatable scenarios
- Upbeat energy

### Playful
- Fun, energetic language
- Humor where appropriate
- Dynamic visuals

### Luxury
- Elegant, sophisticated language
- Premium imagery
- Slower, deliberate pacing

### Technical
- Precise, informative language
- Feature-focused
- Data-driven messaging

### Friendly
- Warm, approachable language
- Personal connection
- Inclusive messaging

## Output Format
Return a JSON object with scenes array and music object.
