use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse_macro_input,
    parse::{Parse, ParseStream},
    punctuated::Punctuated,
    Expr,
    ItemFn,
    Lit,
    Meta,
    Token,
};

/// Wrapper type to parse #[fetch(...)] arguments like:
/// #[fetch(interval = 30)]
struct FetchArgs {
    metas: Punctuated<Meta, Token![,]>,
}

impl Parse for FetchArgs {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        // parse `Meta` items separated by commas
        let metas = Punctuated::<Meta, Token![,]>::parse_terminated(input)?;
        Ok(FetchArgs { metas })
    }
}

#[proc_macro_attribute]
pub fn fetch(args: TokenStream, input: TokenStream) -> TokenStream {
    // The function being annotated
    let func = parse_macro_input!(input as ItemFn);
    let func_name = &func.sig.ident;

    // The arguments to #[fetch(...)]
    let args_parsed = parse_macro_input!(args as FetchArgs);

    let mut interval_value: Option<u64> = None;

    // Support: #[fetch(interval = 30)]
    for meta in args_parsed.metas {
        if let Meta::NameValue(kv) = meta {
            if kv.path.is_ident("interval") {
                if let Expr::Lit(expr_lit) = kv.value {
                    if let Lit::Int(v) = expr_lit.lit {
                        interval_value = Some(v.base10_parse::<u64>().unwrap());
                    }
                }
            }
        }
    }

    let interval_value =
        interval_value.expect("Missing required argument: #[fetch(interval = ...)]");

    let expanded = quote! {
        #func

        // Automatically register this function as a FetchNode
        inventory::submit! {
            crate::scheduler::node::FetchNode {
                name: stringify!(#func_name),
                interval: #interval_value,
                callback: #func_name,
            }
        }
    };

    TokenStream::from(expanded)
}
