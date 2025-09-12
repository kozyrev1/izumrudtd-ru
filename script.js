document.addEventListener('DOMContentLoaded', function() {

    // --- БЛОК УПРАВЛЕНИЯ МОДАЛЬНЫМ ОКНОМ COOKIE ---
    const modalOverlay = document.getElementById('cookie-modal-overlay');
    const acceptBtn = document.getElementById('cookie-accept-btn');

    if (!localStorage.getItem('cookieConsent')) {
        modalOverlay.classList.add('active');
    }

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'true');
        modalOverlay.classList.remove('active');
    });

    // --- УЛУЧШЕННЫЙ БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); 

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const privacyCheckbox = document.getElementById('privacy-agree');
            if (!privacyCheckbox.checked) {
                alert('Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.');
                return;
            }

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // 1. Генерируем уникальный номер заявки
            const orderId = 'IZ-' + String(Date.now()).slice(-6);

            // 2. Устанавливаем тему письма и адрес для копии (автоответа)
            const subjectInput = document.getElementById('form-subject');
            const ccInput = document.getElementById('form-cc');
            
            subjectInput.value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;
            if (data.email) {
                ccInput.value = data.email;
            }

            // 3. Отправляем данные в Formspree (это отправит письмо вам и копию пользователю)
            const formspreePromise = fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: new FormData(contactForm), // Formspree лучше работает с FormData для скрытых полей
                headers: { 'Accept': 'application/json' }
            });

            // 4. Отправляем уведомление в Telegram
            let telegramMessage = `✅ <b>Заявка №${orderId}</b>\n\n`;
            telegramMessage += `<b>Имя:</b> ${data.name}\n`;
            telegramMessage += `<b>Телефон:</b> ${data.phone}\n\n`;
            if (data.request) {
                telegramMessage += `<b>Запрос:</b> ${data.request}\n\n`;
            }
            telegramMessage += `<i>Подробности и email на почте.</i>`;

            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(telegramMessage)}&parse_mode=html`;
            const telegramPromise = fetch(telegramUrl);

            // 5. Ждем завершения всех операций и сообщаем результат
            Promise.allSettled([formspreePromise, telegramPromise])
                .finally(() => {
                    alert('Спасибо! Ваша заявка отправлена. Мы скоро свяжемся с вами. Если вы указали Email, копия заявки отправлена вам на почту.');
                    contactForm.reset();
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
        });
    }
});