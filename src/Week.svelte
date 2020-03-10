<script>
  export let week
  export let readonly

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const validateHours = e => {
    // TODO: Validate input.
		dispatch('estimateUpdated', {});
	}
</script>

<span class="weekday">
  Måndag<br />
  <input type="number" bind:value={week.mon.am.hours} on:change={validateHours} readonly={readonly} /><br />
  <input type="number" bind:value={week.mon.pm.hours} on:change={validateHours} readonly={readonly} /><br />
</span>
<span class="weekday">
  Tisdag<br />
  <input type="number" bind:value={week.tue.am.hours} on:change={validateHours} readonly={readonly} /><br />
  <input type="number" bind:value={week.tue.pm.hours} on:change={validateHours} readonly={readonly} /><br />
</span>
<span class="weekday">
  Onsdag<br />
  <input type="number" bind:value={week.wed.am.hours} on:change={validateHours} readonly={readonly} /><br />
  <input type="number" bind:value={week.wed.pm.hours} on:change={validateHours} readonly={readonly} /><br />
</span>
<span class="weekday">
  Torsdag<br />
  <input type="number" bind:value={week.thu.am.hours} on:change={validateHours} readonly={readonly} /><br />
  <input type="number" bind:value={week.thu.pm.hours} on:change={validateHours} readonly={readonly} /><br />
</span>
<span class="weekday">
  Fredag<br />
  <input type="number" bind:value={week.fri.am.hours} on:change={validateHours} readonly={readonly} /><br />
  <input type="number" bind:value={week.fri.pm.hours} on:change={validateHours} readonly={readonly} /><br />
</span>

<style>
  input[type=number] {
		width: 100px;
	}

	span.weekday {
		display: inline-block;
		margin: 2px 4px;
	}
</style>