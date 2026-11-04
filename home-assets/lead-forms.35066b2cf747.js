(() => {
  const config = JSON.parse(document.getElementById('home-lead-config').textContent);
  const pending = new WeakSet();
  window.kvalitiSendLead = async (form, feedback, source) => {
    if (pending.has(form)) return;
    const values = new FormData(form);
    feedback.hidden = false;
    if (!values.get('consent') || !form.reportValidity()) return;
    if (!config.endpoint) {
      feedback.textContent = 'Отправка временно недоступна. Напишите в Telegram @timur_kisiev или позвоните +7 961 078-28-68.';
      return;
    }
    const text = (name) => String(values.get(name) || '').trim();
    const body = {
      ...(config.accessKey ? { access_key: config.accessKey, subject: 'Заявка с сайта Квалити' } : {}),
      'Имя': text('name'),
      'Телефон или Telegram': text('contact') || text('phone'),
      'Ниша': text('niche'),
      'Сайт': text('site'),
      'Бюджет в месяц': text('budget'),
      'Текущая стоимость заявки': text('cpl'),
      'Что уже пробовали': text('tried'),
      'Откуда заявка': source,
      'Согласие на обработку ПДн': `да, ${new Date().toISOString()}, редакция ${config.docsVersion}`,
      'Страница': location.href,
    };
    const buttons = [...form.querySelectorAll('button[type="submit"], [data-forecast-skip]')];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    pending.add(form);
    buttons.forEach((button) => { button.disabled = true; });
    feedback.textContent = 'Отправляем заявку…';
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) throw new Error('Submission failed');
      feedback.textContent = 'Спасибо! Заявка отправлена. Свяжемся с вами, чтобы обсудить задачу.';
      feedback.classList.add('is-ready');
      form.reset();
      if (config.ymId && typeof window.ym === 'function') window.ym(config.ymId, 'reachGoal', 'form_submit', { source });
    } catch {
      feedback.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите в Telegram @timur_kisiev.';
    } finally {
      clearTimeout(timeout);
      pending.delete(form);
      buttons.forEach((button) => { button.disabled = false; });
    }
  };
  if (config.ymId) {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${config.ymId}`;
    document.head.append(script);
    window.ym(config.ymId, 'init', { webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true });
  }
})();
