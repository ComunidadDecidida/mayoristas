import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { image, folder, filename } = await req.json();

    if (!image || !folder || !filename) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan parámetros requeridos: image, folder, filename' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validFolders = ['products', 'banners', 'brands', 'categories'];
    if (!validFolders.includes(folder)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Carpeta no válida. Usar: products, banners, brands o categories' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const filePath = `${folder}/${filename}`;

      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('images')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Error al subir a storage: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabaseClient
        .storage
        .from('images')
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrlData.publicUrl,
          filename: filename,
          path: filePath,
          message: 'Imagen subida exitosamente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Error processing image:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Error al procesar la imagen'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error general:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
