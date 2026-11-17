<?php
// ===== Настройки =====
$to      = 'noreply@izumrudtd.ru';
$subject = 'Новая заявка с сайта izumrudtd.ru';
$headers = 'From: no-reply@izumrudtd.ru' . "\r\n" .
           'Reply-To: no-reply@izumrudtd.ru' . "\r\n" .
           'Content-Type: text/plain; charset=UTF-8' . "\r\n" .
           'X-Mailer: PHP/' . phpversion();

// ===== Сбор данных из формы =====
$name     = isset($_POST['name'])    ? trim($_POST['name'])    : '';
$company  = isset($_POST['company']) ? trim($_POST['company']) : '';
$email    = isset($_POST['email'])   ? trim($_POST['email'])   : '';
$phone    = isset($_POST['phone'])   ? trim($_POST['phone'])   : '';
$message  = isset($_POST['message']) ? trim($_POST['message']) : '';
$agree    = isset($_POST['agree'])   ? 'да'                    : 'нет';
$ip       = $_SERVER['REMOTE_ADDR'] ?? '';
$ua       = $_SERVER['HTTP_USER_AGENT'] ?? '';
$referer  = $_SERVER['HTTP_REFERER'] ?? '';
$date     = date('Y-m-d H:i:s');

// ===== Письмо =====
$body  = "Новая заявка с сайта izumrudtd.ru\n\n";
$body .= "Дата:        $date\n";
$body .= "Имя:         $name\n";
$body .= "Компания:    $company\n";
$body .= "Телефон:     $phone\n";
$body .= "E-mail:      $email\n";
$body .= "Согласие:    $agree\n";
$body .= "Сообщение:   $message\n\n";
$body .= "---\nIP: $ip\nUser-Agent: $ua\nСтраница: $referer\n";

mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);

// ===== Сохранение в CSV =====
$logDir  = __DIR__ . '/logs';
$csvFile = $logDir . '/leads.csv';

if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Заголовок, если файл создан впервые
if (!file_exists($csvFile)) {
    $header = "Дата;Имя;Компания;Телефон;E-mail;Согласие;Сообщение;IP\n";
    file_put_contents($csvFile, "\xEF\xBB\xBF" . $header);
}

// Готовим строку: убираем переводы строк и кавычки внутри полей
function csvField($s) {
    $s = str_replace(["\r", "\n"], ' ', $s);
    $s = str_replace('"', '""', $s);
    return '"' . $s . '"';
}

$line = implode(';', [
    csvField($date),
    csvField($name),
    csvField($company),
    csvField($phone),
    csvField($email),
    csvField($agree),
    csvField($message),
    csvField($ip),
]) . "\n";

file_put_contents($csvFile, $line, FILE_APPEND | LOCK_EX);

// ===== Переход на страницу «Спасибо» =====
header('Location: thankyou.html');
exit;
