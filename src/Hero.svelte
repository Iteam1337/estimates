<style>
  #hero {
    position: absolute;
    margin: 35px auto;
    width: 100%;
    height: 50%;
    left: 50;
    top: -20px;

    background: url('/hero.png');
    mix-blend-mode: normal;
    opacity: 0.8;
    border-radius: 28px;

    z-index: 0;
  }

  @media (max-width: 640px) {
		#hero {
      position: absolute;
      width: 100%;
      height: 50%;
      left: 0;
      top: -20px;

      background: url('/hero.png');
      mix-blend-mode: normal;
      opacity: 0.8;
      border-radius: 28px;

      z-index: 0;
    }
	}
</style>

<div id="hero" />