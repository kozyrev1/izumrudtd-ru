<?php
// Обработка заявки с сайта izumrudtd.ru — данные не покидают территорию РФ

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

// Скрытое поле-ловушка для спам-ботов: боты заполняют всё подряд, люди — нет
if (!empty($_POST['website'])) {
    header('Location: /thankyou.html');
    exit;
}

function clean($s) {
    return trim(strip_tags($s ?? ''));
}

$name    = clean($_POST['name'] ?? '');
$company = clean($_POST['company'] ?? '');
$phone   = clean($_POST['phone'] ?? '');
$email   = clean($_POST['email'] ?? '');
$message = clean($_POST['message'] ?? '');

// Обязательные: имя + хоть один контакт + согласие
if ($name === '' || ($phone === '' && $email === '') || empty($_POST['consent'])) {
    http_response_code(400);
    exit('Заполните обязательные поля и подтвердите согласие на обработку персональных данных.');
}

$to = 'td.ural-izumrud@yandex.ru';

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта izumrudtd.ru') . '?=';

$body = "Новая заявка с сайта izumrudtd.ru\n\n";
$body .= "Имя: " . $name . "\n";
if ($company !== '') $body .= "Компания: " . $company . "\n";
if ($phone !== '')   $body .= "Телефон: " . $phone . "\n";
if ($email !== '')   $body .= "Email: " . $email . "\n";
if ($message !== '') $body .= "Сообщение:\n" . $message . "\n";
$body .= "\nДата отправки: " . date('d.m.Y H:i') . "\n";

$headers  = "From: =?UTF-8?B?" . base64_encode('Сайт izumrudtd.ru') . "?= <noreply@izumrudtd.ru>\r\n";
$headers .= "Reply-To: " . ($email !== '' ? $email : $to) . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $subject, $body, $headers)) {
    header('Location: /thankyou.html');
    exit;
}

http_response_code(500);
exit('Не удалось отправить заявку. Попробуйте позже или позвоните нам: +7 (982) 623-17-74.');
