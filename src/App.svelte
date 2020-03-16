<script>
  import Hero from './Hero.svelte'

  import Team from './Wizard/Team.svelte'

  import Calculator from './Calculator.svelte'
  import Information from './Information.svelte'
  import Menu from './Menu.svelte'

  let view = 'Calculator'

  const selectViewEventHandler = ({ detail }) => {
    view = detail.view
  }
</script>

<main>
  <Hero />

  <Team />
  



</main>

<style>
  main {
    margin: 35px auto;
    width: 50%;
    min-width: 600px;
  }

  

	@media (max-width: 640px) {
		main {
      margin: 0;
      width: 100%;
      min-width: auto;
		}
	}
</style>