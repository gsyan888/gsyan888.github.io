//set options of RufflePlayer
window.addEventListener("load", (event) => {
	window.RufflePlayer = window.RufflePlayer || {};

	//optons for loading fonts and set default fonts (Chinese fonts)
	window.RufflePlayer.config.fontSources = ["https://gsyan888.github.io/fonts/Iansui-Regular.ttf"];
	window.RufflePlayer.config.defaultFonts = {
		sans: ["Iansui Regular", "Noto Sans TC Regular", "Noto Sans TC Light", "Noto Sans TC Thin"]
	};
});
