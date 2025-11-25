export default function NextButton() {
	return (
		<div className='mt-8'>
			<button
				type='submit'
				className='w-full py-3 bg-[var(--primary)] text-white text-lg font-medium rounded-full hover:opacity-90 transition-opacity'
			>
				Next
			</button>
		</div>
	);
}
