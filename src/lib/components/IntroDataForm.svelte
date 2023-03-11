{#if introData.request === undefined}
  <p class="text-center">What do you need?</p>
  <div class="flex flex-col gap-2">
    <button
      class="btn btn-accent"
      on:click={() => {
        introData.request = 'empathy'
        introData.names = ['']
      }}
    >
      I need empathy
    </button>
    <button
      class="btn btn-accent"
      on:click={() => {
        introData.request = 'mediation'
        introData.names = ['', '']
      }}
    >
      I need mediation
    </button>
  </div>
{:else}
  <p class="text-center">
    {introData.request === 'empathy' ? "What's your name?" : 'What are your names?'}
  </p>

  <form
    class="flex flex-col gap-2"
    on:submit|preventDefault={() => dispatch('submit', introData)}
  >
    {#each introData.names as name, i}
      <!-- svelte-ignore a11y-autofocus -->
      <input
        class="input input-bordered"
        type="text"
        bind:value={introData.names[i]}
        autocorrect="off"
        spellcheck="false"
        autocomplete="off"
        list="autocompleteOff"
        aria-autocomplete="none"
        autofocus={i === 0}
        placeholder={introDataNamesSpaceholders[introData.request][i]}
      />
    {/each}
    <button class="input btn btn-accent" type="submit">
      Continue
    </button>
  </form>
{/if}

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{
    'submit': IntroData
  }>()

	const introData: IntroData = {
		request: undefined,
		names: [''],
	}

  const introDataNamesSpaceholders = {
    empathy: ['Your name...'],
    mediation: ['Your name...', 'Their name...']
  }
</script>