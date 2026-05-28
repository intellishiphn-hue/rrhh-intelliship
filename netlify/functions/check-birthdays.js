// Netlify Scheduled Function - se ejecuta todos los dias a las 8:00 AM Honduras (UTC-6 = 14:00 UTC)
// schedule: "0 14 * * *"

const schedule = require("@netlify/functions").schedule;

const EMAILJS_SERVICE  = "service_ae309iq";
const EMAILJS_TEMPLATE = "template_au2kuvi";
const EMAILJS_KEY      = "q9dny_O5VCALgIzDB";

// Empleados con sus cumpleanos y emails
// Actualiza este arreglo cuando cambien los datos
const EMPS = [
  {id:"IS-001",n:"Judith",   a:"Xiomaris Centeno Pinel",  nb:"1995-01-22", e:""},
  {id:"IS-002",n:"Brayan",   a:"Alexander Mejia Ramos",   nb:"2002-03-24", e:""},
  {id:"IS-003",n:"Ana",      a:"Beatriz Ortez Lopez",     nb:"1997-03-05", e:""},
  {id:"IS-004",n:"Lesnin",   a:"Mexali Pinel",            nb:"1998-02-27", e:""},
  {id:"IS-005",n:"Wuendy",   a:"Sarahi Alvarado Navarro", nb:"1995-08-07", e:""},
  {id:"IS-006",n:"Jose",     a:"Fernando Carrasco",       nb:"2005-07-02", e:""},
  {id:"IS-007",n:"Angel",    a:"Daniel Garcia Lopez",     nb:"1994-02-21", e:""},
  {id:"IS-008",n:"Hecto",    a:"Ricardo Zuniga",          nb:"1986-11-26", e:""},
  {id:"IS-009",n:"Kevin",    a:"Josue Zelaya Amador",     nb:"1993-04-10", e:""},
  {id:"IS-010",n:"Larissa",  a:"Gissel Ortez Lopez",      nb:"2004-03-16", e:""}
];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const BDAY_MSG    = "Estimado/a {nombre}, en nombre de todo el equipo de INTELLISHIP Honduras le deseamos un muy feliz cumpleaños. Es un privilegio contar con usted en nuestro equipo. Feliz cumpleaños! Equipo INTELLISHIP Honduras";

async function sendEmail(to, subject, message) {
  if (!to) return;
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE,
      template_id: EMAILJS_TEMPLATE,
      user_id:     EMAILJS_KEY,
      template_params: {
        to_email: to,
        subject:  subject,
        message:  message
      }
    })
  });
  console.log("Email enviado a", to, "| Status:", res.status);
}

function getTemplate(title, body) {
  return `
  <div style="background:#f4f6fb;padding:40px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:36px;text-align:center;">
        <img src="https://i.postimg.cc/nV2CfGnh/logo-intelliship-letras-blancas.png" style="height:48px;">
      </div>
      <div style="padding:40px;">
        <h1 style="font-size:26px;color:#0f172a;margin-bottom:20px;">${title}</h1>
        <div style="font-size:16px;line-height:1.8;color:#475569;">${body}</div>
        <div style="margin-top:36px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px;">
          Equipo INTELLISHIP Honduras
        </div>
      </div>
    </div>
  </div>`;
}

function bdaysOn(offsetDays) {
  const now = new Date();
  const tgt = new Date(now);
  tgt.setDate(tgt.getDate() + offsetDays);
  const m = tgt.getMonth() + 1;
  const d = tgt.getDate();
  return EMPS.filter(e => {
    if (!e.nb) return false;
    const b = new Date(e.nb + "T00:00:00");
    return b.getMonth() + 1 === m && b.getDate() === d;
  });
}

const handler = schedule("0 14 * * *", async () => {
  console.log("Verificando cumpleaños - " + new Date().toISOString());

  // Cumpleaños HOY
  const hoy = bdaysOn(0);
  for (const emp of hoy) {
    if (!emp.e) continue;
    // Felicitar al cumpleañero
    const msg = BDAY_MSG.replace(/{nombre}/g, emp.n + " " + emp.a);
    await sendEmail(emp.e, "Feliz Cumpleaños, " + emp.n + "! 🎂",
      getTemplate("¡Feliz Cumpleaños, " + emp.n + "! 🎂", msg));

    // Avisar a todo el equipo
    for (const otros of EMPS) {
      if (otros.id !== emp.id && otros.e) {
        await sendEmail(otros.e, "🎂 Hoy cumple años " + emp.n + " " + emp.a,
          getTemplate("Cumpleaños de " + emp.n + " " + emp.a,
            "Estimado/a " + otros.n + ",<br><br>Hoy es el cumpleaños de <strong>" + emp.n + " " + emp.a + "</strong>. Los invitamos a enviarle sus felicitaciones."));
      }
    }

    // Avisar al admin
    if (ADMIN_EMAIL) {
      await sendEmail(ADMIN_EMAIL, "[RRHH] Cumpleaños: " + emp.n + " " + emp.a,
        getTemplate("Recordatorio RRHH", "Hoy es el cumpleaños de <strong>" + emp.n + " " + emp.a + "</strong>."));
    }
  }

  // Cumpleaños en 3 dias - solo aviso al admin
  const en3 = bdaysOn(3);
  for (const emp of en3) {
    if (ADMIN_EMAIL) {
      await sendEmail(ADMIN_EMAIL, "[RRHH] En 3 días cumple años " + emp.n + " " + emp.a,
        getTemplate("Recordatorio RRHH", "En 3 días, <strong>" + emp.n + " " + emp.a + "</strong> cumple años."));
    }
  }

  return { statusCode: 200 };
});

module.exports = { handler };
