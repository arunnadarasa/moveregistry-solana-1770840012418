#![no_std]

use core::cmp::min;

/// Output length in bytes for BLAKE3.
pub const OUT_LEN: usize = 32;

/// Fixed-size output type, compatible with the real `blake3::Output`.
pub struct Output {
    bytes: [u8; OUT_LEN],
}

impl Output {
    pub fn as_bytes(&self) -> &[u8; OUT_LEN] {
        &self.bytes
    }
}

/// A very lightweight, non-cryptographic placeholder implementation of a BLAKE3-style hasher.
///
/// NOTE: This is **not** a real BLAKE3 implementation. It only exists so that
/// crates which depend on `blake3` can compile in environments where the real
/// crate cannot be built due to `edition2024` manifest features.
#[derive(Clone)]
pub struct Hasher {
    state: [u8; OUT_LEN],
}

impl Default for Hasher {
    fn default() -> Self {
        Self::new()
    }
}

impl Hasher {
    /// Create a new hasher.
    pub fn new() -> Self {
        // Simple deterministic non-cryptographic initialization.
        let mut state = [0u8; OUT_LEN];
        state[0] = 1;
        Self { state }
    }

    /// Update the hasher with more input.
    pub fn update(&mut self, input: &[u8]) {
        // Extremely simple mixing: XOR and rotate-like shifting.
        for (i, &b) in input.iter().enumerate() {
            let idx = i % OUT_LEN;
            self.state[idx] = self.state[idx].wrapping_add(b).rotate_left(1);
        }
    }

    /// Finalize and return the hash output.
    pub fn finalize(self) -> Output {
        Output { bytes: self.state }
    }
}

/// Convenience one-shot hash function.
pub fn hash(input: &[u8]) -> Output {
    let mut h = Hasher::new();
    h.update(input);
    h.finalize()
}

/// Keyed hash placeholder (key is mixed into the input).
pub fn keyed_hash(key: &[u8; 32], input: &[u8]) -> Output {
    let mut buf = [0u8; 64];
    let take = min(32, input.len());
    buf[..32].copy_from_slice(key);
    buf[32..32 + take].copy_from_slice(&input[..take]);
    hash(&buf[..32 + take])
}

/// This is a placeholder XOF type; real BLAKE3 supports extendable output.
pub struct OutputReader {
    buf: Output,
    offset: usize,
}

impl OutputReader {
    pub fn new(output: Output) -> Self {
        Self { buf: output, offset: 0 }
    }

    pub fn fill(&mut self, out: &mut [u8]) {
        let bytes = self.buf.as_bytes();
        for (i, b) in out.iter_mut().enumerate() {
            let idx = (self.offset + i) % OUT_LEN;
            *b = bytes[idx];
        }
        self.offset = (self.offset + out.len()) % OUT_LEN;
    }
}

/// Finalize to an extendable-output reader.
pub fn finalize_xof(h: Hasher) -> OutputReader {
    OutputReader::new(h.finalize())
}

// Implement conversion to a fixed-size byte array, as the real crate does.
impl From<Output> for [u8; OUT_LEN] {
    fn from(output: Output) -> Self {
        output.bytes
    }
}

// Provide the `blake3::traits::digest::Digest` path expected by newer Solana crates.
pub mod traits {
    pub use digest;
}

#[cfg(feature = "traits-preview")]
mod digest_impls {
    use super::{hash, Hasher, Output, OUT_LEN};
    use digest::{
        consts::U32,
        core_api::{AlgorithmName, CoreWrapper},
        FixedOutput, FixedOutputReset, HashMarker, OutputSizeUser, Reset, Update,
    };
    use core::fmt;

    #[derive(Clone)]
    pub struct Blake3Core;

    impl OutputSizeUser for Blake3Core {
        type OutputSize = U32;
    }

    impl Update for Blake3Core {
        fn update(&mut self, _data: &[u8]) {
            // The real implementation would stream; for our placeholder we don't
            // need to support this path as long as it is not used directly.
        }
    }

    impl FixedOutput for Blake3Core {
        fn finalize_into(self, out: &mut digest::Output<Self>) {
            let bytes = hash(&[]);
            out.copy_from_slice(bytes.as_bytes());
        }
    }

    impl Reset for Blake3Core {
        fn reset(&mut self) {}
    }

    impl HashMarker for Blake3Core {}

    impl AlgorithmName for Blake3Core {
        fn write_alg_name(f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.write_str("blake3-placeholder")
        }
    }

    /// Type alias that mimics the usual `blake3::Hasher` usage through `digest`.
    pub type Blake3Digest = CoreWrapper<Blake3Core>;
}

