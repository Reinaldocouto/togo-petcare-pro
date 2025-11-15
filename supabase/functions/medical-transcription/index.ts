import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, petName, species } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Processing audio transcription...');

    // Step 1: Transcribe audio using OpenAI Whisper
    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('prompt', 'Transcrição de consulta veterinária com termos médicos em português.');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcribedText = transcriptionResult.text;
    
    console.log('Transcription completed:', transcribedText.substring(0, 100));

    // Step 2: Format transcription into SOAP format using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const petContext = petName && species ? `\nPaciente: ${petName} (${species})` : '';
    
    const systemPrompt = `Você é um assistente especializado em medicina veterinária. Sua função é transformar transcrições de consultas veterinárias em registros médicos estruturados no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).

Diretrizes:
- Use terminologia médica veterinária precisa e formal
- Organize as informações nas seções SOAP apropriadas
- Mantenha tom profissional e objetivo
- Corrija erros gramaticais e de pontuação
- Padronize abreviações médicas (FC, FR, TPC, etc.)
- Se informações faltarem em uma seção, deixe em branco ou indique "não mencionado"
- Seja conciso mas completo

Formato de saída esperado:
SUBJETIVO (Anamnese):
[Queixa principal, histórico, observações do tutor]

OBJETIVO (Exame Clínico):
[Temperatura, FC, FR, mucosas, ausculta, palpação, etc.]

AVALIAÇÃO (Diagnóstico):
[Diagnóstico presuntivo ou definitivo, diagnósticos diferenciais]

PLANO (Tratamento):
[Medicações prescritas, procedimentos, orientações ao tutor]`;

    const soapResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Transcreva a seguinte consulta veterinária no formato SOAP:${petContext}\n\nTranscrição:\n${transcribedText}` 
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!soapResponse.ok) {
      const errorText = await soapResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`SOAP formatting failed: ${errorText}`);
    }

    const soapResult = await soapResponse.json();
    const formattedText = soapResult.choices[0].message.content;

    console.log('SOAP formatting completed');

    // Parse SOAP sections
    const parseSOAP = (text: string) => {
      const sections = {
        subjetivo: '',
        objetivo: '',
        avaliacao: '',
        plano: ''
      };

      const subjMatch = text.match(/SUBJETIVO[\s\S]*?:([\s\S]*?)(?=OBJETIVO|$)/i);
      const objMatch = text.match(/OBJETIVO[\s\S]*?:([\s\S]*?)(?=AVALIAÇÃO|AVALIACAO|$)/i);
      const avalMatch = text.match(/AVALIAÇÃO[\s\S]*?:|AVALIACAO[\s\S]*?:([\s\S]*?)(?=PLANO|$)/i);
      const planoMatch = text.match(/PLANO[\s\S]*?:([\s\S]*?)$/i);

      if (subjMatch) sections.subjetivo = subjMatch[1].trim();
      if (objMatch) sections.objetivo = objMatch[1].trim();
      if (avalMatch) sections.avaliacao = avalMatch[1].trim();
      if (planoMatch) sections.plano = planoMatch[1].trim();

      return sections;
    };

    const soapSections = parseSOAP(formattedText);

    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        formatted: formattedText,
        soap: soapSections
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in medical-transcription:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
