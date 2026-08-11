// Verifica que la conexión con Supabase funciona correctamente
async function checkConnection() {
  const statusEl = document.getElementById("connection-status");

  try {
    // Llamada mínima al backend: consulta el estado de sesión de auth
    const { error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    statusEl.textContent = "✅ Conectado a Supabase correctamente";
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-ok");
  } catch (err) {
    statusEl.textContent = "❌ Error de conexión: " + err.message;
    statusEl.classList.remove("status-loading");
    statusEl.classList.add("status-error");
  }
}

document.addEventListener("DOMContentLoaded", checkConnection);
