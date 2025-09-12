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

    // --- БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); 

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const privacyCheckbox = document.getElementById('privacy-agree');
        if (!privacyCheckbox.checked) {
            alert('Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.');
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // --- ЗАЩИТА ОТ ПОВТОРНЫХ НАЖАТИЙ ---
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // 1. ОСНОВНОЕ ДЕЙСТВИЕ: Отправка на Email через Formspree
        fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Accept': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                alert('Спасибо! Ваша заявка успешно отправлена.');
                sendTelegramNotification(data); 
                contactForm.reset();
            } else {
                response.json().then(data => {
                    alert('Произошла ошибка при отправке. Попробуйте снова.');
                    sendTelegramNotification(data, true);
                });
            }
        })
        .catch(error => {
            alert('Произошла ошибка сети. Пожалуйста, проверьте ваше интернет-соединение.');
            sendTelegramNotification(data, true);

        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        });
    });

    // Вспомогательная функция для отправки УВЕДОМЛЕНИЯ в Telegram
    function sendTelegramNotification(data, isError = false) {
        let message = '✅ Новая заявка с сайта izumrudtd.ru\n';
        if (isError) {
            message = '❗️ ОШИБКА EMAIL. Заявка только в Telegram\n';
        }

        message += `<b>Имя:</b> ${data.name}\n`;
        message += `<b>Телефон:</b> ${data.phone}\n`;
        message += `<b>Email:</b> ${data.email || 'не указан'}\n`;
        message += `<b>Город:</b> ${data.city || 'не указан'}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;
        
        fetch(url);
    }
});