<script>
  export let week

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const change = e => {
    // TODO: Validate input.
		dispatch('estimateUpdated', {});
  }
</script>

<span class="weekday">
  Måndag<br />
  <input type="checkbox" bind:checked={week.mon.am} on:change={change} /><br />
  <input type="checkbox" bind:checked={week.mon.pm} on:change={change} /><br />
</span>
<span class="weekday">
  Tisdag<br />
  <input type="checkbox" bind:checked={week.tue.am} on:change={change} /><br />
  <input type="checkbox" bind:checked={week.tue.pm} on:change={change} /><br />
</span>
<span class="weekday">
  Onsdag<br />
  <input type="checkbox" bind:checked={week.wed.am} on:change={change} /><br />
  <input type="checkbox" bind:checked={week.wed.pm} on:change={change} /><br />
</span>
<span class="weekday">
  Torsdag<br />
  <input type="checkbox" bind:checked={week.thu.am} on:change={change} /><br />
  <input type="checkbox" bind:checked={week.thu.pm} on:change={change} /><br />
</span>
<span class="weekday">
  Fredag<br />
  <input type="checkbox" bind:checked={week.fri.am} on:change={change} /><br />
  <input type="checkbox" bind:checked={week.fri.pm} on:change={change} /><br />
</span>

<style>
	span.weekday {
		display: inline-block;
		margin: 2px 4px;
	}
</style>