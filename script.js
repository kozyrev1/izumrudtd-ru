document.addEventListener('DOMContentLoaded', function() {

    // --- БЛОК УПРАВЛЕНИЯ COOKIE ---
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');

    if (!localStorage.getItem('cookieConsent')) {
        cookieBanner.classList.add('active');
    }

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'true');
        cookieBanner.classList.remove('active');
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

        // !!! ЗАМЕНИТЕ ЭТИ ДАННЫЕ НА ВАШИ !!!
        const BOT_TOKEN = '8320122576:AAG8tOmrKMJBV_4NmbLT4PP19_pccY0gXkM'; 
        const CHAT_ID = '-1002915497111';     

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