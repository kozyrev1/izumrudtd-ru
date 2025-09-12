document.addEventListener('DOMContentLoaded', function() {

    // --- БЛОК УПРАВЛЕНИЯ МОДАЛЬНЫМ ОКНОМ COOKIE (без изменений) ---
    const modalOverlay = document.getElementById('cookie-modal-overlay');
    const acceptBtn = document.getElementById('cookie-accept-btn');

    if (!localStorage.getItem('cookieConsent')) {
        modalOverlay.classList.add('active');
    }

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'true');
        modalOverlay.classList.remove('active');
    });

    // --- ОБНОВЛЕННЫЙ БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); // Используем старый ID, чтобы не менять HTML

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
                // Если email ушел успешно, показываем сообщение и отправляем уведомление в TG
                alert('Спасибо! Ваша заявка успешно отправлена.');
                sendTelegramNotification(data); // Отправляем уведомление в Telegram
                contactForm.reset();
            } else {
                // Если ошибка с почтой, пытаемся отправить хотя бы в Telegram
                response.json().then(data => {
                    if (data.errors) {
                        alert("Ошибка: " + data.errors.map(error => error.message).join(", "));
                    } else {
                        alert('Произошла ошибка при отправке на почту. Попробуйте снова.');
                    }
                    sendTelegramNotification(data, true); // Отправляем с пометкой об ошибке
                });
            }
        })
        .catch(error => {
            // Если совсем нет сети
            alert('Произошла ошибка сети. Пожалуйста, проверьте ваше интернет-соединение.');
            sendTelegramNotification(data, true); // Отправляем с пометкой об ошибке
        })
        .finally(() => {
            // В любом случае разблокируем кнопку
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        });
    });

    // Вспомогательная функция для отправки УВЕДОМЛЕНИЯ в Telegram
    function sendTelegramNotification(data, isError = false) {
        let message = '<b>✅ Новая заявка с сайта izumrudtd.ru</b>\n';
        if (isError) {
            message = '<b>❗️ ОШИБКА EMAIL. Заявка только в Telegram</b>\n';
        }

        message += `<b>Имя:</b> ${data.name}\n`;
        message += `<b>Телефон:</b> ${data.phone}\n`;
        message += `<b>Email:</b> ${data.email || 'не указан'}\n`;
        message += `<b>Город:</b> ${data.city || 'не указан'}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;
        
        // Отправляем "тихо", без ожидания ответа, т.к. это лишь уведомление
        fetch(url);
    }
});