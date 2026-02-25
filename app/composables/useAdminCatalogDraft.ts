export function useAdminCatalogDraft() {
    const draftId = useState<string | null>("admin-catalog-draft-id", () => null);

    function setDraftId(value: string | null | undefined) {
        draftId.value = value && value.length > 0 ? value : null;
    }

    return {
        draftId,
        setDraftId,
    };
}
