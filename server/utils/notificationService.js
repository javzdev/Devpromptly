const Notification = require('../models/Notification');
const User = require('../models/User');

const notificationService = {
  // Notify prompt author — approved
  promptApproved: async (prompt) => {
    await Notification.create({
      recipient: prompt.author._id || prompt.author,
      type: 'prompt_approved',
      title: '🎉 Tu prompt fue aprobado',
      message: `"${prompt.title}" ya es visible para la comunidad.`,
      link: `/prompt/${prompt._id}`,
      meta: { promptId: prompt._id }
    });
  },

  // Notify prompt author — rejected
  promptRejected: async (prompt, reason) => {
    await Notification.create({
      recipient: prompt.author._id || prompt.author,
      type: 'prompt_rejected',
      title: 'Tu prompt no fue aprobado',
      message: reason
        ? `"${prompt.title}" fue rechazado: ${reason}`
        : `"${prompt.title}" fue rechazado por el equipo de moderación.`,
      link: `/my-prompts`,
      meta: { promptId: prompt._id, reason }
    });
  },

  // Notify prompt author — warned by admin
  warnAuthor: async (prompt, resolutionNote) => {
    await Notification.create({
      recipient: prompt.author._id || prompt.author,
      type: 'report_resolved',
      title: '⚠ Advertencia sobre tu prompt',
      message: resolutionNote
        ? `Tu prompt "${prompt.title}" recibió una advertencia: ${resolutionNote}`
        : `Tu prompt "${prompt.title}" fue reportado por la comunidad. Por favor revisa las normas de la plataforma.`,
      link: `/prompt/${prompt._id}`,
      meta: { promptId: prompt._id }
    });
  },

  // Notify all admins and moderators — new report
  newReport: async (reportId, promptTitle, reporterUsername) => {
    const admins = await User.find({ role: { $in: ['admin', 'moderator'] }, isActive: true }).select('_id');
    if (!admins.length) return;

    await Notification.insertMany(admins.map(admin => ({
      recipient: admin._id,
      type: 'new_report',
      title: 'Nuevo reporte de contenido',
      message: `@${reporterUsername} reportó el prompt "${promptTitle}".`,
      link: '/admin',
      meta: { reportId }
    })));
  },

  // Notify all admins and moderators — new prompt pending review
  newPendingPrompt: async (promptId, promptTitle, authorUsername) => {
    const admins = await User.find({ role: { $in: ['admin', 'moderator'] }, isActive: true }).select('_id');
    if (!admins.length) return;

    await Notification.insertMany(admins.map(admin => ({
      recipient: admin._id,
      type: 'new_pending_prompt',
      title: 'Nuevo prompt pendiente de revisión',
      message: `@${authorUsername} publicó "${promptTitle}".`,
      link: '/admin',
      meta: { promptId }
    })));
  }
};

module.exports = notificationService;
