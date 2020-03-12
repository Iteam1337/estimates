<script>
  import Calculator from './Calculator.svelte'
  import Information from './Information.svelte'
  import Menu from './Menu.svelte'

  let view = 'Calculator'

  const selectViewEventHandler = ({ detail }) => {
    view = detail.view
  }
</script>

<main>
  <h1>Priskalkylator</h1>

  <Menu view={view} on:selectView={selectViewEventHandler} />

  {#if view === 'Calculator'}
    <Calculator />
  {/if}

  {#if view === 'Information'}
    <Information />
  {/if}
</main>

<style>
  main {
    margin: 35px auto;
    width: 50%;
    min-width: 600px;
  }

	@media (max-width: 640px) {
		main {
			width: 100%;
		}
	}
</style>