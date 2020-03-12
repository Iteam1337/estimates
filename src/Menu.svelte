<script>
  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  export let view
  const select = view => {
		dispatch('selectView', {
			view
		})
  }
  
  const buttonClass = view => {
    return 'meow'
  }
</script>

<button on:click={() => select('Calculator')}  class="{view === 'Calculator' ? 'active' : ''}">Sätt ihop ett team</button>
<button on:click={() => select('Information')} class="{view === 'Information' ? 'active' : ''}">Läs mer</button>

<style>
  button {
		border: 0px;
		background-color: rgba(71, 253, 164, 1);
		margin: 0 2px;
		padding: 8px 10px;
  }
  
  button.active {
    color: rgba(100, 100, 100, 1);
    background-color: rgba(240, 240, 240, 1);
  }
</style>