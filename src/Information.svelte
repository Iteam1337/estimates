<script>
	import { Roles } from './data/roles.js'
</script>

<h2>Information</h2>
<hr />
{#each Object.keys(Roles) as role}
  <h3>{role}</h3>
  <p>
    {Roles[role].description}<br /><br />
    <span class="highlight">Timtaxa: {Roles[role].rate} kr/h</span>
  </p>
{/each}