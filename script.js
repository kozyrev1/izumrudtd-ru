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

    // --- ФИНАЛЬНЫЙ БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); 

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
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

            const orderId = 'IZ-' + String(Date.now()).slice(-6);

            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;
            
            try {
                const formspreePromise = sendToFormspree(new FormData(contactForm));
                const telegramPromise = sendToTelegram(data, orderId);
                await Promise.all([formspreePromise, telegramPromise]);
                alert(`Спасибо! Ваша заявка №${orderId} принята. Мы скоро свяжемся с вами.`);
                contactForm.reset();
            } catch (error) {
                console.error("Ошибка при отправке на Formspree:", error);
                alert('Произошла ошибка при отправке. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    async function sendToFormspree(formData) {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Ошибка Formspree: ${response.statusText}`);
        }
        return response.json();
    }

    async function sendToTelegram(data, orderId) {
        let telegramMessage = `✅ <b>Новая заявка №${orderId}</b>\n\n`;
        telegramMessage += `<b>Имя:</b> ${data.name}\n`;
        telegramMessage += `\n<i>Все подробности на почте.</i>`;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(telegramMessage)}&parse_mode=html`;
        
        try {
            const response = await fetch(telegramUrl);
            if (!response.ok) {
                console.error('Ошибка отправки в Telegram: ', await response.json());
            }
        } catch (error) {
            console.error('Сетевая ошибка при отправке в Telegram: ', error);
        }
    }
});