//set options of RufflePlayer
window.RufflePlayer = window.RufflePlayer || {};

//right click or long press in touch mode can tigger menu show
window.RufflePlayer.config.contextMenu = 'on';
window.RufflePlayer.config.letterbox = "on"; //hide the areas outside the movie stage
window.RufflePlayer.config.allowFullscreen = true;

//optons for loading fonts and set default fonts (Chinese fonts)
window.RufflePlayer.config.fontSources = ["https://gsyan888.github.io/fonts/Iansui-Regular.ttf"];
window.RufflePlayer.config.defaultFonts = {
	sans: ["Iansui Regular", "Noto Sans TC Regular", "Noto Sans TC Light", "Noto Sans TC Thin", "全字庫說文解字"]
};
