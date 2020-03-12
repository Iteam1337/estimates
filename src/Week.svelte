<script>
  export let week
</script>

<span class="weekday">
  Måndag<br />
  <span class={week.mon.am.hours > 0 ? 'highlight' : ''}>{week.mon.am.hours}</span><br />
  <span class={week.mon.pm.hours > 0 ? 'highlight' : ''}>{week.mon.pm.hours}</span><br />
</span>
<span class="weekday">
  Tisdag<br />
  <span class={week.tue.am.hours > 0 ? 'highlight' : ''}>{week.tue.am.hours}</span><br />
  <span class={week.tue.pm.hours > 0 ? 'highlight' : ''}>{week.tue.pm.hours}</span><br />
</span>
<span class="weekday">
  Onsdag<br />
  <span class={week.wed.am.hours > 0 ? 'highlight' : ''}>{week.wed.am.hours}</span><br />
  <span class={week.wed.pm.hours > 0 ? 'highlight' : ''}>{week.wed.pm.hours}</span><br />
</span>
<span class="weekday">
  Torsdag<br />
  <span class={week.thu.am.hours > 0 ? 'highlight' : ''}>{week.thu.am.hours}</span><br />
  <span class={week.thu.pm.hours > 0 ? 'highlight' : ''}>{week.thu.pm.hours}</span><br />
</span>
<span class="weekday">
  Fredag<br />
  <span class={week.fri.am.hours > 0 ? 'highlight' : ''}>{week.fri.am.hours}</span><br />
  <span class={week.fri.pm.hours > 0 ? 'highlight' : ''}>{week.fri.pm.hours}</span><br />
</span>

<style>
  span.weekday {
		display: inline-block;
    margin: 2px 10px;
    text-align: center;
    vertical-align: center;
  }
</style>