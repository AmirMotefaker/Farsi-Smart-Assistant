// content_script.js
try {
    const results = [];
    // این سلکتورها نتایج اصلی گوگل را هدف قرار می‌دهند
    const searchResults = document.querySelectorAll('div.g'); 
    
    searchResults.forEach((result, index) => {
        if (index < 3) { // فقط ۳ نتیجه اول
            const titleElement = result.querySelector('h3');
            const linkElement = result.querySelector('a');
            // تلاش برای پیدا کردن بهترین توضیح موجود
            const descriptionElement = result.querySelector('div[style*="-webkit-line-clamp:2"], div[style*="-webkit-line-clamp: 4"]');

            if (titleElement && linkElement) {
                results.push({
                    title: titleElement.innerText,
                    link: linkElement.href,
                    description: descriptionElement ? descriptionElement.innerText : ''
                });
            }
        }
    });

    chrome.runtime.sendMessage({ type: "googleSearchResults", results: results });
} catch (error) {
    chrome.runtime.sendMessage({ type: "googleSearchResults", results: [] });
}