Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("send-whatsapp-notification payload:", body);
    
    // Simular processamento de notificação WhatsApp
    const response = {
      ok: true,
      message: "Notificação WhatsApp processada com sucesso",
      timestamp: new Date().toISOString(),
      payload: body
    };
    
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Erro na função send-whatsapp-notification:", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "invalid json",
      message: error.message 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }
});

