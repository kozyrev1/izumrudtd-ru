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

    // --- БЛОК ОТПРАВКИ ФОРМЫ В TELEGRAM ---
    const telegramForm = document.getElementById('telegram-form');

    telegramForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const privacyCheckbox = document.getElementById('privacy-agree');
        if (!privacyCheckbox.checked) {
            alert('Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.');
            return;
        }
        
        // Ключи BOT_TOKEN и CHAT_ID берутся из файла config.js
        // Здесь их больше нет!

        let message = '<b>Заявка с сайта izumrudtd.ru</b>\n';
        message += `<b>Имя:</b> ${this.name.value}\n`;
        message += `<b>Телефон:</b> ${this.phone.value}\n`;
        message += `<b>Email:</b> ${this.email.value || 'не указан'}\n`;
        message += `<b>Город:</b> ${this.city.value || 'не указан'}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    alert('Спасибо! Ваша заявка успешно отправлена.');
                    this.reset();
                } else {
                    alert('Произошла ошибка. Попробуйте снова или свяжитесь с нами по телефону.');
                }
            })
            .catch(error => {
                alert('Произошла ошибка сети. Пожалуйста, проверьте ваше интернет-соединение.');
            });
    });
});