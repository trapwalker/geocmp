// Пример пользовательского скрипта
// Нажмите Q чтобы увидеть сообщение

console.log('Custom script loaded! Press Q to test.');

document.addEventListener('keydown', function(event) {
	if (event.key === 'q' || event.key === 'Q') {
		alert('Custom script works! ✓\n\nYou can add any JavaScript code here.');
	}
});
