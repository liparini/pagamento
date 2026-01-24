const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
sgMail.setApiKey("SENDGRID_API_KEY");

exports.notificarContasVencendo = functions.pubsub
  .schedule("every day 08:00")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {

    const hoje = new Date().toISOString().slice(0,10);
    const snap = await admin.firestore()
      .collection("contas")
      .where("vencimento", "==", hoje)
      .where("status", "==", "pendente")
      .get();

    snap.forEach(async doc => {
      const c = doc.data();

      await admin.messaging().send({
        notification: {
          title: "Conta vencendo hoje!",
          body: c.descricao
        },
        topic: c.uid
      });

      await sgMail.send({
        to: c.email,
        from: "alerta@controlecontas.com",
        subject: "Conta vencendo hoje",
        text: `Sua conta "${c.descricao}" vence hoje.`
      });
    });

    return null;
  });
