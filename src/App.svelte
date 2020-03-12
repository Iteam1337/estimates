<script>
  import Calculator from './Calculator.svelte'
</script>

<main>
  <h1>Priskalkylator</h1>
  <Calculator />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>